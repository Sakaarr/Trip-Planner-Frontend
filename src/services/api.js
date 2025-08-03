// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://sakarbh.pythonanywhere.com/api/", // Adjust if deployed
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
