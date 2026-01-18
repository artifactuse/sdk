import Vue from 'vue'
import PortalVue from 'portal-vue'
import App from './App.vue'
import '../../src/styles/artifactuse.css';

Vue.use(PortalVue)

new Vue({
  render: h => h(App),
}).$mount('#app')
