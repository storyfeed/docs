import {createApp} from 'vue';
import Fixture from './Fixture.vue';
import '../source/website/preflight.css';
import '../source/website/resources/css/storyfeed-tokens.css';
import '../source/website/resources/js/feed/feed.css';
import './shell.css';
document.documentElement.classList.toggle('dark',new URLSearchParams(location.search).get('theme')==='dark');
createApp(Fixture).mount('#app');
