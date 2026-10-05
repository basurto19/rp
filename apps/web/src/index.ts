import { AppRegistry } from 'react-native-web';
import App from './App';
import './styles.css';

AppRegistry.registerComponent('AptaERP', () => App);

const rootTag = document.getElementById('root');

if (rootTag) {
  AppRegistry.runApplication('AptaERP', { rootTag });
}// apps/web/src/index.ts
// React Native Web - Dashboard ERP
// Se implementará cuando comience la Fase 8

export { } from 'react-native-web';
