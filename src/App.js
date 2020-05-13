import React, { Component } from 'react';
import ReactPlayer from 'react-player'
import './App.css';

const debug = false;
const LOGIN = "LOGIN";
const IDLE = "IDLE";
const PLAYING = "PLAYING";
const baseUrl = "https://staging-iot-backend.herokuapp.com"
const POLL_TIME = 4000;

class App extends Component {
  constructor() {
    super()
    this.state = {
      appState: LOGIN,
      url: '',
      order: '',
      loginFieldValue: null
    }
    window.onmousemove = this.onMouseMove.bind(this);
    this.videoPlayer = React.createRef();
    this.initialPollWait = 3000;
  }

  componentDidMount() {
    this.screensaver = window.document.getElementById("screensaver");
    this.lowerCurtain = window.document.getElementById("lower-curtain");
    this.upperCurtain = window.document.getElementById("upper-curtain");
    //For some reason video player does not autoplay reliably if first play is too fast.
    if (this.getCurrentId() != null) {
      setTimeout(() => { this.setState({ ...this.state, appState: IDLE }) }, 1);
    }
  }

  componentDidUpdate(_, prevState) {
    if (prevState.appState !== this.state.appState) {
      this.changeState(this.state.appState);
    }
  }

  hideCurtain() {
    if(this.upperCurtain != null) {
      this.upperCurtain.classList.add("hidden");
      this.lowerCurtain.classList.add("hidden");
    }
  }

  showCurtain() {
    if(this.upperCurtain != null) {
      this.lowerCurtain.classList.remove("hidden");
      this.upperCurtain.classList.remove("hidden");
    }
  }

  hideScreensaver() {
    if (this.screensaver != null) {
      this.screensaver.classList.remove("fadein");
      this.screensaver.classList.add("fadeout");
    }
  }

  getCurrentId() {
    return window.localStorage.getItem("id");
  }
  
  showScreenSaver() {
    if (this.screensaver != null) {
      this.screensaver.classList.remove("fadeout");
      this.screensaver.classList.add("fadein");
    }
  }

  checkPlaybackFailure() {
    setTimeout(() => {
      if(!this.videoPlayer.current.player.isPlaying) {
        console.log("Detected playback error, trying again")
        this.setState({...this.state, appState: "IDLE"});
      }
    }, 3500)
  }

  onProgress = (progress) => {
    //start fading out when video almost done
    let timeleftSec = -(progress.playedSeconds - progress.playedSeconds / progress.played);
    if (timeleftSec < 5)
      this.showCurtain();
    if (timeleftSec < 3)
      this.showScreenSaver();
  }

  onDuration = (duration) => {
    this.currentVideoLength = duration;
  }

  onEnded = () => {
    return this.creditRemove()
      .catch(e => {
        console.error("Error on removing credits, see console:");
        console.error(e);
      })
      .finally(() => {
        this.setState({ ...this.state, appState: IDLE })
      })
  }

  changeState(appState) {
    if (debug)
      console.log("TRANSITIONING TO " + appState);
    switch (this.state.appState) {
      case IDLE:
        setTimeout(() => this.Poll(), this.initialPollWait);
        this.showScreenSaver();
        break;
      case PLAYING:
        this.hideScreensaver();
        this.checkPlaybackFailure();
        break;
      case LOGIN:
        this.showCurtain();
        this.showScreenSaver();
        break;
      default: return
    }
  }

  appInnerWindow() {
    let innerComponent;
    switch (this.state.appState) {
      case IDLE: innerComponent = <this.idle />; break;
      case PLAYING: innerComponent = <this.video />; break;
      case LOGIN: innerComponent = <this.login/>; break;
      default: innerComponent = <this.error />
    }
    return(
    <div>
      <this.logoutButton/>
      {innerComponent}
    </div>
    )
  }

  render = this.appInnerWindow;

  login = () => {
    return (
      <div className="login-container">
        <div className ="login-box">
          <div className="login-content">
          <input type="text" placeholder="Enter the ID of this display" onChange={(e) => {this.onTextChanged(e.target.value)}} id="login-input"/>
            <button onClick={() => {this.setLoggedInId()}} style={{marginLeft: "1em"}} id="login-button">LOG IN</button>
          </div>
          </div>
      </div>
    )
  }

  error = () => <div style={{ color: "red", fontSize: "21px" }}>ERROR NO STATE</div>

  appOverlay = () => <div className="app-overlay" />

  idle = () => <div className="idle-container" />

  logoutButton = () => (<button className="moving-button" onClick={() => {this.logout()}} id="logout-button">LOG OUT</button>)

  video = () => {
    return (
    <div>
      <div className="video-container">
        <div className="video-player-box" id="video-box">
          <ReactPlayer
            ref={this.videoPlayer}
            onPlay={() => {this.hideCurtain()}}
            showinfo="false"
            width="1280px"
            height="720px"
            url={this.state.video.url}
            playing={true}
            onEnded={() => { this.onEnded() }}
            onProgress={p => { this.onProgress(p)}}
            onDuration={d => {this.onDuration(d)}}
            id="video-player" />
        </div>
      </div>
      {this.logoutButton()}
    </div>
    )
  }

  Poll = () => {
    let pollOnTimeout = () => setTimeout(
      this.Poll,
      POLL_TIME);
    fetch(`${baseUrl}/video/${this.getCurrentId()}`)
      .then(resp => resp.json())
      .then(data => {
        if (!data || !data.video || data.video == null) {
          if (!data)
            console.error("There was an unexpected response from server (no response)")
          return pollOnTimeout();
        }
        else {
          this.setState({
            ...this.state,
            appState: "PLAYING",
            video: data.video
          })
        }
      })
      .catch(e => {
        console.error("Error when polling server:");
        console.error(e);
        return pollOnTimeout();
      })
  }

  onMouseMove() {
    clearTimeout(this.logoutButtonTimeRef);
    let btn = window.document.getElementById("logout-button");
    if(btn !== null && this.state.appState !== LOGIN) {
      btn.classList.add("shown");
      this.logoutButtonTimeRef = setTimeout(() => {
      btn.classList.remove("shown")}, 2000)
    }
  }
  
  onTextChanged(value) {
    this.setState({...this.state, loginFieldValue: value})
  }

  setLoggedInId() {
    if(this.loginFieldValue !== null) {
      window.localStorage.setItem("id", this.state.loginFieldValue);  
      this.setState({...this.state, loginFieldValue: null, appState:IDLE });
      
    }
  }

  logout() {
    let btn = window.document.getElementById("logout-button");
    if(btn !== null) 
      btn.classList.remove("shown");

    window.localStorage.removeItem("id");
    this.setState({...this.state, appState: LOGIN})
  }

  creditRemove = () => {
    return fetch(`${baseUrl}/views/${this.getCurrentId()}/${this.state.video.videoId}/${this.state.video.order}`, { 
      method: 'POST',
      body: JSON.stringify({length_sec: this.currentVideoLength})
    })
      .then(resp => {
        if (resp.status !== 200)
          console.error("Unexpected return status from remove credits: " + resp.status);
        return resp.json();
      })
      .catch(e => {
        console.error("Error when removing credits:");
        console.error(e);
        return Promise.reject("Error");
      })
  }
}

export default App;