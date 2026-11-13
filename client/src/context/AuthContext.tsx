import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@offline-tracker/shared';
import { api } from '../services/api.js';

export const DEMO_USERS: User[] = [
  {
    id: 'usr-tech-001',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.mansoor@nilepixel.local',
    role: 'FIELD_WORKER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-tech-002',
    name: 'Amina Yusuf',
    email: 'amina.yusuf@nilepixel.local',
    role: 'FIELD_WORKER',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-coord-001',
    name: 'John Mwangi',
    email: 'john.mwangi@nilepixel.local',
    role: 'COORDINATOR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-coord-002',
    name: 'Sarah Chen',
    email: 'sarah.chen@nilepixel.local',
    role: 'COORDINATOR',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  },
];

interface AuthContextType {
  currentUser: User;
  users: User[];
  isCoordinator: boolean;
  isFieldWorker: boolean;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('fit_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return DEMO_USERS[0]; // Default to Tariq Al-Mansoor
  });

  useEffect(() => {
    // Attempt to pull latest registered users from backend when available
    api
      .fetchUsers()
      .then((serverUsers) => {
        if (serverUsers && serverUsers.length > 0) {
          setUsers(serverUsers);
          const currentInServer = serverUsers.find((u) => u.id === currentUser.id);
          if (currentInServer) setCurrentUser(currentInServer);
        }
      })
      .catch(() => {
        // Offline: use hardcoded fallback users
      });
  }, []);

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('fit_current_user', JSON.stringify(target));
    }
  };

  const switchRole = (role: UserRole) => {
    const firstOfRole = users.find((u) => u.role === role);
    if (firstOfRole) {
      setCurrentUser(firstOfRole);
      localStorage.setItem('fit_current_user', JSON.stringify(firstOfRole));
    }
  };

  const value = {
    currentUser,
    users,
    isCoordinator: currentUser.role === 'COORDINATOR',
    isFieldWorker: currentUser.role === 'FIELD_WORKER',
    switchUser,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

