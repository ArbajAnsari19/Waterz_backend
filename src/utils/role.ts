import  User, {  Agent, Owner }  from "../models/User";

export function findRoleById(role: string) {
    switch (role) {
      case 'agent':
        return Agent;
      case 'owner':
        return Owner;
      }
      return User;
  }