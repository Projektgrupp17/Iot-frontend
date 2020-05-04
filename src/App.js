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
    }
    this.initialPollWait = 3000;
  }

  componentDidMount() {
    this.screensaver = window.document.getElementById("screensaver");
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

  hideScreensaver() {
    if (this.screensaver != null) {
      this.screensaver.classList.remove("fadein");
      this.screensaver.classList.add("fadeout");
    }
  }

  showScreenSaver() {
    if (this.screensaver != null) {
      this.screensaver.classList.remove("fadeout");
      this.screensaver.classList.add("fadein");
    }
  }

  onProgress = (progress) => {
    //start fading out at < 2 seconds left
    let timeleftSec = -(progress.playedSeconds - progress.playedSeconds / progress.played);
    if (timeleftSec < 2.0)
      this.showScreenSaver();
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
        break;
      case LOGIN: return
      default: return
    }
  }

  getCurrentId() {
    return window.localStorage.getItem("id");
  }

  appInnerWindow() {
    switch (this.state.appState) {
      case IDLE: return <this.idle />
      case PLAYING: return <this.video />
      case LOGIN: return <div>UNIMPLEMENTED</div>
      default: return <this.error />
    }
  }

  render = this.appInnerWindow;

  error = () => <div style={{ color: "red", fontSize: "21px" }}>ERROR NO STATE</div>

  appOverlay = () => <div className="app-overlay" />

  idle = () => <div className="idle-container" />

  video = () => {
    return (
      <div className="video-container">
        <div className="video-player-box">
          <ReactPlayer
            width="1280px"
            height="720px"
            url={this.state.video.url}
            playing={true}
            onEnded={() => { this.onEnded() }}
            onProgress={p => this.onProgress(p)}
            id="video-player" />
        </div>
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

  creditRemove = () => {
    return fetch(`${baseUrl}/views/${this.getCurrentId()}/${this.state.video.videoId}/${this.state.video.order}`, { method: 'POST' })
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
