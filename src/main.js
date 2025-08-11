import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "../src/style.css";
import { createHead } from '@unhead/vue/client'

const app = createApp(App)
app.use(router)
app.use(createHead())
app.mount('#app')


