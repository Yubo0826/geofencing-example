import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/main.css'

const app = createApp(App)
app.config.globalProperties.apiKey = 'NcN9JRPbjXaf2ywN-7_sAwlKpxOBO5hKauFC6FqAEkU'

app.use(ElementPlus).mount('#app')
