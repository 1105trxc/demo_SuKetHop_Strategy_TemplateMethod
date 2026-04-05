import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
//    baseURL: 'https://unevadable-chrissy-unslouching.ngrok-free.dev/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tự động gắn thẻ VIP (Token) vào mỗi lần gọi API
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosClient;