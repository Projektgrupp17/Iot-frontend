/**
 * Testing: Tests all the states of the app.
 * For testing where http requests are made, use 'nock' to mock them
 * For testing where rendered compoenents are not checed, use enzyme.shallow
 * For testing where the app is rerendered, and or rerendered, use enzyme.mount (use update() to force rerender after state change)
 * 
 * getTestInstance returns a modified app where lifetime is much faster than normal startup, so can be tested without waiting long times.
 * Chai expect can be used for assertions
 * 
 *
 */
 ///TODO: Test 'login' state

 import React from 'react';
import ReactPlayer from 'react-player'
import { configure, shallow, mount } from 'enzyme';
import { expect } from 'chai';
import App from './App'
import Adapter from 'enzyme-adapter-react-16'
import nock from 'nock';

const err = global.window.console.error;   
const baseUrl = "https://staging-iot-backend.herokuapp.com"
const successVideoObj = {
  "message": "video found",
  "video": {
    "length": 100,
    "order": "72b7c8a3-ddc6-464e-9ce4-7506fa149c48",
    "url": "https://www.youtube.com/watch?v=6VsJgk5Qw6s",
    "videoId": 53
  }
};

configure({ adapter: new Adapter() });

//Returns a sped up app instance
function getShallowTestInstance() {
  const app = shallow(<App />);
  app.instance().initialPollWait = 100;
  return app;
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    nock.cleanAll();
  });
  
  describe("login Screen", () => {
    it("App starts in login mode when no id", (done) => {
      const app = shallow(<App />);
      setTimeout(() => {
        expect(app.instance().state.appState).to.equal("LOGIN");
        done()
      }, 100)
    });
  });

  describe("video presenter", () => {
    describe("idle mode", () => {
      it("App transitions to idle mode when id found", (done) => {
        global.localStorage.setItem("id", 1);
        const app = shallow(<App />);
        setTimeout(() => {
          expect(app.instance().state.appState).to.equal("IDLE");
          done()
        }, 100)
      });
    });

    describe("playing mode", () => {
      it("transitions to playing when video found", (done) => {
        global.localStorage.setItem("id", 10);

        nock(baseUrl)
          .persist()
          .get('/video/10')
          .reply(200, successVideoObj, {
            'Access-Control-Allow-Origin': '*',
            'Content-type': 'application/json'
          });

        const app = mount(<App/>);
        app.instance().initialPollWait = 100;
        setTimeout(() => {
          app.update();
          expect(app.instance().state.appState).to.equal("PLAYING");
          expect(app.find(ReactPlayer).prop('url')).to.equal("https://www.youtube.com/watch?v=6VsJgk5Qw6s")
          expect(app.find(ReactPlayer).prop('playing')).to.be.true
          expect(app.find(ReactPlayer).prop('width')).to.equal("1280px")
          expect(app.find(ReactPlayer).prop('height')).to.equal("720px")
          done();
        }, 500)
      });

      it("does not transition to playing when no video found", (done) => {
        global.localStorage.setItem("id", 10);
        nock(baseUrl)
          .persist()
          .get('/video/10')
          .reply(200,
            { "message": "no video found", "video": null },
            { 'Access-Control-Allow-Origin': '*', 'Content-type': 'application/json' });
        const app = getShallowTestInstance();
        setTimeout(() => {
          expect(app.instance().state.appState).to.equal("IDLE");
          done()
        }, 200)
      });

      it("handles 404 when invalid id", (done) => {
        global.localStorage.setItem("id", 10);
        nock(baseUrl)
          .persist()
          .get('/video/10')
          .reply(404,
            { "reason": "not found", "status": "error" },
            { 'Access-Control-Allow-Origin': '*', 'Content-type': 'application/json' });

        const app = getShallowTestInstance();
        setTimeout(() => {
          expect(app.instance().state.appState).to.equal("IDLE");
          done()
        }, 200)
      });

      it("handles error when getting video", (done) => {
        global.localStorage.setItem("id", 10);
        nock(baseUrl)
          .persist()
          .get('/video/10')
          .reply(500,
            null,
            { 'Access-Control-Allow-Origin': '*', 'Content-type': 'application/json' });
            
            const app = getShallowTestInstance();
            setTimeout(() => {
              expect(app.instance().state.appState).to.equal("IDLE");
              done()
            }, 200)
          });

          it("handles clientError when getting video", (done) => {
            global.localStorage.setItem("id", 10);
            nock(baseUrl)
            .persist()
            .get('/video/10')
            .reply(500,
              null,{'Content-type': 'application/json'});
              
            const app = getShallowTestInstance();
            global.window.console.error = (_l) => {}
            setTimeout(() => {
              global.window.console.error = err;
              expect(app.instance().state.appState).to.equal("IDLE");
              done()
            }, 200)
          });
          
      it("draws credits on 'onEnded'", (done) => {
        global.localStorage.setItem("id", 10);
        nock(baseUrl)
          .persist()
          .get('/video/10')
          .reply(200, successVideoObj, {
            'Access-Control-Allow-Origin': '*',
            'Content-type': 'application/json'
          });

        nock(baseUrl)
          .post('/views/10/53/72b7c8a3-ddc6-464e-9ce4-7506fa149c48')
          .reply(200, {
            "message": "video play logged",
            "status": "success"
          }, {
            'Access-Control-Allow-Origin': '*',
            'Content-type': 'application/json'
          });

        const app = getShallowTestInstance();
        setTimeout(() => {
          expect(app.instance().state.appState).to.equal("PLAYING");
          app.instance().onEnded().then(() => {
            expect(app.instance().state.appState).to.equal("IDLE");
            done()
          });
        }, 200)
      });

      it("handles server error on drawcredits", (done) => {
        global.localStorage.setItem("id", 10);
        nock(baseUrl)
          .persist()
          .get('/video/10')
          .reply(200, successVideoObj, {
            'Access-Control-Allow-Origin': '*',
            'Content-type': 'application/json'
          });

        nock(baseUrl)
          .post('/views/10/53/72b7c8a3-ddc6-464e-9ce4-7506fa149c48')
          .replyWithError("there was a server error");

        const app = getShallowTestInstance();

        setTimeout(() => {
          expect(app.instance().state.appState).to.equal("PLAYING");
          global.window.console.error = (_l) => {}
          app.instance().onEnded().then(() => {
            expect(app.instance().state.appState).to.equal("IDLE");
            done()
          })
          .finally(() => {
            global.window.console.error = err;
          })
        }, 200)
      });

      it("handles client error on drawcredits", (done) => {
        global.localStorage.setItem("id", 10);
        nock(baseUrl)
        .persist()
        .get('/video/10')
        .reply(200, successVideoObj, {
          'Access-Control-Allow-Origin': '*',
          'Content-type': 'application/json'
        });
        
        nock(baseUrl)
        .post('/views/10/53/72b7c8a3-ddc6-464e-9ce4-7506fa149c48')
        .reply(200, successVideoObj, {'Content-type': 'application/json'})
        
        const app = getShallowTestInstance();
        setTimeout(() => {
          expect(app.instance().state.appState).to.equal("PLAYING");
          //suppress error
          global.window.console.error = (_l) => {}
          app.instance().onEnded().then(() => {
            expect(app.instance().state.appState).to.equal("IDLE");
            done()
          })
          .finally(() => {
            global.window.console.error = err;
          })
        }, 200)
      });
    });
  });
});