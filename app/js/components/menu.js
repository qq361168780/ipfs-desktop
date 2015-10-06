import React from 'react/addons'
import ipc from 'electron-safe-ipc/guest'

import StartScreen from './screens/start'
import ProfileScreen from './screens/profile'
import Loader from './loader'

import '../../styles/animations.css'

const {CSSTransitionGroup} = React.addons

const UNINITIALIZED = 'uninitialized'
const RUNNING = 'running'
const STARTING = 'starting'
const STOPPING = 'stopping'

export default class Menu extends React.Component {

  state = {
    status: UNINITIALIZED,
    connected: false,
    version: null,
    stats: {},
    files: []
  }

  // -- Event Listeners

  _onVersion = arg => {
    this.setState({version: arg})
  }

  _onNodeStatus = status => {
    this.setState({status: status})
  }

  _onStats = stats => {
    this.setState({stats: stats})
  }

  _onUploading = file => {
    console.log('file being uploaded: ' + file.Name)

    this.setState(old => {
      if (old.files.length >= 5) {
        old.files.shift()
      }

      old.files.push({
        uploaded: false,
        ...file
      })
      return {files: old.files}
    })
  }

  _onUploaded = file => {
    this.setState(old => {
      const files = old.files.map(elem => {
        if (elem.Name === file.Name) {
          elem.uploaded = true
          elem.Hash = file.Hash
        }

        return elem
      })
      console.log(files)
      return {files}
    })
  }

  _startDaemon () {
    ipc.send('start-daemon')
  }

  _stopDaemon () {
    ipc.send('stop-daemon')
  }

  _openConsole () {
    ipc.send('open-console')
  }

  _openBrowser () {
    ipc.send('open-browser')
  }

  _openSettings () {
    ipc.send('open-settings')
  }

  componentDidMount () {
    // -- Listen to control events

    ipc.on('version', this._onVersion)
    ipc.on('node-status', this._onNodeStatus)
    ipc.on('stats', this._onStats)
    ipc.on('uploading', this._onUploading)
    ipc.on('uploaded', this._onUploaded)

    ipc.send('request-state')
  }

  componentWillUnmount () {
    // -- Remove control events

    ipc.removeListener('version', this._onVersion)
    ipc.removeListener('node-status', this._onNodeStatus)
    ipc.removeListener('stats', this._onStats)
    ipc.removeListener('uploading', this._onUploading)
    ipc.removeListener('uploaded', this._onUploaded)
  }

  _getScreen () {
    switch (this.state.status) {
      case RUNNING:
        return (
          <ProfileScreen
            key='profile-screen'
            files={this.state.files}
            peers={this.state.stats.peers}
            location={this.state.stats.location}
            onStopClick={this._stopDaemon}
            onConsoleClick={this._openConsole}
            onBrowserClick={this._openBrowser}
            onSettingsClick={this._openSettings}
            />
        )
      case STARTING:
      case STOPPING:
        return <Loader key='loader-screen' />
      default:
        return <StartScreen key='start-screen' onStartClick={this._startDaemon}/>
    }
  }

  render () {
    return (
      <CSSTransitionGroup transitionName='fade'>
        {this._getScreen()}
      </CSSTransitionGroup>
    )
  }
}