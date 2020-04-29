import React, { Component } from 'react';
import logo from './logo.svg';
import ReactPlayer from 'react-player'
import './App.css';

let video = {url:''}

class App extends Component{
  constructor(){
    super()
    this.Pol()
    this.state = {
      url:'',
      order:'',
    }
  }
  render(){
    return <this.Video/>
  }
  
  Video = () =>{
    return <ReactPlayer url={/*this.state.url*/'https://www.youtube.com/watch?v=pcPi4jPAR2c'} playing={true} onEnded={this.creditRemove}/> 
  }

  Pol = () =>{
    fetch('https://staging-iot-backend.herokuapp.com/video/1')
    .then(resp => resp.json())
    .then(data => this.setState({
      ...this.state,
      url:data.video.url,
      order:data.video.order
    }))

  }

  creditRemove = () =>{
    console.log(this.state)
    fetch(`https://staging-iot-backend.herokuapp.com/views/1/${this.state.videoID}/${this.state.order}`,{method:'POST'})
    this.Pol();
    window.location.pathname ="/"
  }
}

export default App;
