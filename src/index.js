import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

//initialize the css random values
setTimeout(() => {
  for(let i = 0; i < 3; i++) {
    for(let j = 0; j < 4; j++) {
      window.document.getElementById("circle" + i).style.setProperty('--w' + j,( Math.random() * (window.innerWidth - 100)).toFixed(0) + "px");
      window.document.getElementById("circle" + i).style.setProperty('--h' + j,( Math.random() * (window.innerHeight - 100)).toFixed(0) + "px");
    }
  }
}, 50);

ReactDOM.render(
  <React.StrictMode>
    <div className="screensaver-container" id="screensaver">
      <div className="circle c0" id="circle0"/>
      <div className="circle c1" id="circle1"/>
      <div className="circle c2" id="circle2"/>
    </div>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
