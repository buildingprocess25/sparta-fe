import { writable } from 'svelte/store';

// Create a writable store for authentication
const authStore = writable({
    user: null,
    isAuthenticated: false
});

// Function to set user information
export const setUser = (user) => {
    authStore.set({ user, isAuthenticated: true });
};

// Function to clear user information
export const logout = () => {
    authStore.set({ user: null, isAuthenticated: false });
};

// Function to get the current user
export const getUser = () => {
    let currentUser;
    authStore.subscribe((value) => {
        currentUser = value.user;
    });
    return currentUser;
};

// Function to check authentication status
export const isAuthenticated = () => {
    let status;
    authStore.subscribe((value) => {
        status = value.isAuthenticated;
    });
    return status;
};

export default authStore;