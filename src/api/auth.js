import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1/auth';

export const register = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/register`, data);
    return response.data;
};

export const verifyRegisterOtp = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/verify-register-otp`, data);
    return response.data; // Expected: { accessToken, userId, email, fullName, roles }
};

export const login = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/login`, data);
    return response.data; // Expected: { accessToken, userId, email, fullName, roles }
};
