export default {
    getUser() {
        return JSON.parse(localStorage.getItem('user'))
    }
}