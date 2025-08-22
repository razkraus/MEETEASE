// Local in-browser storage based entities to replace Base44 SDK

function createLocalEntity(key) {
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  };

  const save = (data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  return {
    list: async () => load(),
    filter: async (query = {}) => {
      return load().filter(item =>
        Object.entries(query).every(([k, v]) => {
          if (Array.isArray(v)) return v.includes(item[k]);
          return item[k] === v;
        })
      );
    },
    get: async (id) => load().find(item => item.id === id),
    create: async (obj) => {
      const data = load();
      const newObj = { id: Date.now().toString(), ...obj };
      data.push(newObj);
      save(data);
      return newObj;
    },
    update: async (id, updates) => {
      const data = load();
      const idx = data.findIndex(item => item.id === id);
      if (idx === -1) return null;
      data[idx] = { ...data[idx], ...updates };
      save(data);
      return data[idx];
    }
  };
}

export const Meeting = createLocalEntity('meetings');
export const Response = createLocalEntity('responses');
export const Organization = createLocalEntity('organizations');
export const Customer = createLocalEntity('customers');
export const Contact = createLocalEntity('contacts');
export const TeamMember = createLocalEntity('team_members');
export const Notification = createLocalEntity('notifications');
export const Feedback = createLocalEntity('feedback');

const baseUser = createLocalEntity('users');

const defaultUser = {
  id: 'local-user',
  email: 'user@example.com',
  full_name: 'Local User',
  organization_id: null,
  can_create_meetings: true,
};

export const User = {
  ...baseUser,
  me: async () => {
    const stored = localStorage.getItem('currentUser');
    if (stored) return JSON.parse(stored);

    // ensure the default user exists in storage
    const users = await baseUser.list();
    if (!users.find(u => u.id === defaultUser.id)) {
      users.push(defaultUser);
      localStorage.setItem('users', JSON.stringify(users));
    }
    localStorage.setItem('currentUser', JSON.stringify(defaultUser));
    return defaultUser;
  },
  update: async (data) => {
    const current = await User.me();
    const updated = { ...current, ...data };
    await baseUser.update(current.id, updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
    return updated;
  }
};
