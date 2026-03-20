import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

// auto attach token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// add this line to api/client.js
export const getAllLetters = () => api.get('/insights/future-letter/all')


// auth
export const signup = (data) => api.post('/auth/signup', data)
export const login = (data) => api.post('/auth/login', data)

// onboarding
export const getOnboardingStatus = () => api.get('/auth/onboarding/status')
export const submitOnboardingAnswer = (data) => api.post('/auth/onboarding/answer', data)

// journal
export const submitEntry = (data) => api.post('/agent/chat', data)

// insights
export const getCheckinQuestions = () => api.get('/insights/checkin/questions')
export const getCheckinStatus = () => api.get('/insights/checkin/status')
export const submitCheckin = (data) => api.post('/insights/checkin/submit', data)
export const getWeeklyReport = () => api.get('/insights/checkin/weekly-report')
export const getFutureLetter = () => api.get('/insights/future-letter')
export const generateFutureLetter = () => api.post('/insights/future-letter/generate')

// energy tracker
export const getFullEnergyTracker = () => api.get('/energy/full')
export const getEnergyDNA = () => api.get('/energy/dna')
export const getEnergyForecast = () => api.get('/energy/forecast')
export const getEnergyVillain = () => api.get('/energy/villain')
export const getGoldenHours = () => api.get('/energy/golden-hours')
export const getEnergyStreak = () => api.get('/energy/streak')

// alter ego
export const chatAlterEgo = (data) => api.post('/agent/alter-ego', data)
export const clearAlterEgo = () => api.delete('/agent/alter-ego/clear')

export default api