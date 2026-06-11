import os
import random
import threading
from collections import deque
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="ArcticTern MAS ML Server")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QNetwork(nn.Module):
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, output_dim)
        )
        
    def forward(self, x):
        return self.fc(x)

class PyTorchDQNAgent:
    def __init__(self, agent_name, input_dim, actions, epsilon=0.2, alpha=0.005, gamma=0.9):
        self.agent_name = agent_name
        self.input_dim = input_dim
        self.actions = actions
        self.output_dim = len(actions)
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_min = 0.05
        self.epsilon_decay = 0.9995
        
        self.policy_net = QNetwork(input_dim, self.output_dim)
        self.target_net = QNetwork(input_dim, self.output_dim)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.target_net.eval()
        
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=alpha)
        self.loss_fn = nn.MSELoss()
        
        self.memory = deque(maxlen=5000)
        self.batch_size = 32
        self.update_count = 0
        self.target_update_interval = 100
        self.lock = threading.Lock()
        
        self.step_count = 0
        self.train_interval = 8
        
        # Checkpoint path
        self.checkpoint_path = f"{agent_name}_model.pth"
        self.load_checkpoint()
        
    def choose_action(self, state_vector):
        state_t = torch.FloatTensor(state_vector).unsqueeze(0)
        
        # Epsilon-greedy
        is_exploration = random.random() < self.epsilon
        with torch.no_grad():
            q_values = self.policy_net(state_t).numpy()[0]
            
        if is_exploration:
            action_idx = random.randint(0, self.output_dim - 1)
        else:
            action_idx = int(np.argmax(q_values))
            
        return self.actions[action_idx], float(q_values[action_idx]), is_exploration

    def store_transition(self, state, action, reward, next_state):
        try:
            action_idx = self.actions.index(action)
        except ValueError:
            return  # invalid action
        self.memory.append((state, action_idx, reward, next_state))
        self.step_count += 1
        
    def train_step(self):
        if len(self.memory) < self.batch_size:
            return 0.0
            
        batch = random.sample(self.memory, self.batch_size)
        states, actions, rewards, next_states = zip(*batch)
        
        states_t = torch.FloatTensor(states)
        actions_t = torch.LongTensor(actions).unsqueeze(1)
        rewards_t = torch.FloatTensor(rewards)
        next_states_t = torch.FloatTensor(next_states)
        
        # Current Q values
        current_q = self.policy_net(states_t).gather(1, actions_t).squeeze(1)
        
        # Target Q values using Target Net
        with torch.no_grad():
            max_next_q = self.target_net(next_states_t).max(1)[0]
            target_q = rewards_t + self.gamma * max_next_q
            
        loss = self.loss_fn(current_q, target_q)
        
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), 1.0)
        self.optimizer.step()
        
        self.update_count += 1
        
        # Epsilon decay
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
            self.epsilon = max(self.epsilon_min, self.epsilon)
            
        # Target network update
        if self.update_count % self.target_update_interval == 0:
            self.target_net.load_state_dict(self.policy_net.state_dict())
            self.save_checkpoint()
            
        return float(loss.item())

    def save_checkpoint(self):
        try:
            policy_state = {k: v.cpu().clone() for k, v in self.policy_net.state_dict().items()}
            target_state = {k: v.cpu().clone() for k, v in self.target_net.state_dict().items()}
            
            import copy
            try:
                opt_state = copy.deepcopy(self.optimizer.state_dict())
            except Exception:
                opt_state = self.optimizer.state_dict()
                
            checkpoint_data = {
                'policy_net': policy_state,
                'target_net': target_state,
                'optimizer': opt_state,
                'update_count': self.update_count,
                'epsilon': self.epsilon
            }
            
            def save_job():
                try:
                    torch.save(checkpoint_data, self.checkpoint_path)
                except Exception as e:
                    print(f"Error saving checkpoint in background: {e}")
                    
            threading.Thread(target=save_job, daemon=True).start()
        except Exception as e:
            print(f"Error preparing checkpoint for saving: {e}")
        
    def load_checkpoint(self):
        if os.path.exists(self.checkpoint_path):
            try:
                checkpoint = torch.load(self.checkpoint_path, weights_only=True)
                self.policy_net.load_state_dict(checkpoint['policy_net'])
                self.target_net.load_state_dict(checkpoint['target_net'])
                self.optimizer.load_state_dict(checkpoint['optimizer'])
                self.update_count = checkpoint.get('update_count', 0)
                self.epsilon = checkpoint.get('epsilon', self.epsilon)
                print(f"Loaded checkpoint for {self.agent_name} (updates: {self.update_count})")
            except Exception as e:
                print(f"Error loading checkpoint for {self.agent_name}: {e}")

# Instantiate agents
agents = {
    "flight": PyTorchDQNAgent(
        agent_name="flight",
        input_dim=6,
        actions=['REQUEST_LANDING', 'HOLD_PATTERN', 'DIVERT', 'REQUEST_TAKEOFF', 'TAXI_TO_GATE', 'TAXI_TO_RUNWAY'],
        epsilon=0.15,
        alpha=0.002,
        gamma=0.9
    ),
    "runway": PyTorchDQNAgent(
        agent_name="runway",
        input_dim=5,
        actions=['CLEAR_LANDING', 'CLEAR_TAKEOFF', 'HOLD', 'SWITCH_RUNWAY'],
        epsilon=0.2,
        alpha=0.002,
        gamma=0.9
    ),
    "gate": PyTorchDQNAgent(
        agent_name="gate",
        input_dim=4,
        actions=['ASSIGN_GATE', 'REASSIGN', 'HOLD_TAXIWAY', 'RELEASE'],
        epsilon=0.2,
        alpha=0.002,
        gamma=0.9
    )
}

# Request schemas
class DecideRequest(BaseModel):
    agent_type: str
    state: list[float]

class LearnRequest(BaseModel):
    agent_type: str
    state: list[float]
    action: str
    reward: float
    next_state: list[float]

class LearnSample(BaseModel):
    state: list[float]
    action: str
    reward: float
    next_state: list[float]

class LearnBatchRequest(BaseModel):
    agent_type: str
    samples: list[LearnSample]

class SeedSample(BaseModel):
    state: list[float]
    action: str
    targetQ: float

class SeedRequest(BaseModel):
    agent_type: str
    samples: list[SeedSample]

@app.post("/decide")
def decide(req: DecideRequest):
    agent = agents.get(req.agent_type)
    if not agent:
        return {"error": "Invalid agent type"}
    with agent.lock:
        action, q_value, was_exploration = agent.choose_action(req.state)
    return {
        "action": action,
        "q_value": q_value,
        "was_exploration": was_exploration,
        "epsilon": agent.epsilon,
        "updates": agent.update_count
    }

@app.post("/learn")
def learn(req: LearnRequest):
    agent = agents.get(req.agent_type)
    if not agent:
        return {"error": "Invalid agent type"}
    
    loss = 0.0
    with agent.lock:
        agent.store_transition(req.state, req.action, req.reward, req.next_state)
        if agent.step_count % agent.train_interval == 0:
            loss = agent.train_step()
    
    return {
        "loss": loss,
        "updates": agent.update_count,
        "epsilon": agent.epsilon
    }

@app.post("/learn_batch")
def learn_batch(req: LearnBatchRequest):
    agent = agents.get(req.agent_type)
    if not agent:
        return {"error": "Invalid agent type"}
    
    loss = 0.0
    with agent.lock:
        for sample in req.samples:
            agent.store_transition(sample.state, sample.action, sample.reward, sample.next_state)
        
        num_updates = len(req.samples) // agent.train_interval
        if num_updates > 0:
            for _ in range(min(num_updates, 4)):
                loss = agent.train_step()
                
    return {
        "loss": loss,
        "updates": agent.update_count,
        "epsilon": agent.epsilon
    }

@app.post("/seed")
def seed(req: SeedRequest):
    agent = agents.get(req.agent_type)
    if not agent:
        return {"error": "Invalid agent type"}
    
    # Simple supervised gradient step for seeding
    loss_val = 0.0
    with agent.lock:
        for sample in req.samples:
            try:
                action_idx = agent.actions.index(sample.action)
            except ValueError:
                continue
            
            state_t = torch.FloatTensor(sample.state).unsqueeze(0)
            target = torch.FloatTensor([sample.targetQ])
            
            q_values = agent.policy_net(state_t)
            current_val = q_values[0, action_idx].unsqueeze(0)
            
            loss = agent.loss_fn(current_val, target)
            agent.optimizer.zero_grad()
            loss.backward()
            agent.optimizer.step()
            loss_val += float(loss.item())
            
        # Sync target network after seeding
        agent.target_net.load_state_dict(agent.policy_net.state_dict())
    return {"status": "seeded", "average_loss": loss_val / max(1, len(req.samples))}

@app.get("/stats")
def stats():
    return {
        name: {
            "type": "Python (PyTorch DQN)",
            "updates": agent.update_count,
            "epsilon": f"{agent.epsilon:.3f}",
            "layers": len(list(agent.policy_net.fc.children())) // 2 + 1,  # count Linear layers
            "neurons": f"{agent.input_dim} → 32 → 16 → {agent.output_dim}"
        }
        for name, agent in agents.items()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
