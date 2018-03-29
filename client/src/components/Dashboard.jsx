import React from 'react';
import Poll from './Poll.jsx';
import axios from 'axios';
import cookie from 'react-cookie';
import {Link, Route, Redirect} from 'react-router-dom';
import {
  Card,
  Button,
  Container,
  Header,
  Icon,
  Segment,
} from 'semantic-ui-react';
import '../style/dashboard.css';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      polls: [],
      currentPoll: {},
      loggedIn: false,
      currentUser: ''
    }
  }

  componentDidMount() {
    axios.get('/poll')
    .then(res => {
      this.setState({
        polls: res.data
      });
    })
    .catch(err => {
      console.log(err);
    });
  }

  render() {
    let polls = this.state.polls;
    if (cookie.load('loggedIn') !== 'true') {
      return (<Redirect to='/' />)
    } 
    return (
      <div>
        <div className='headers'>
          <h2 className='dashboardTitle'>Your Ballot Dashboard</h2>
          <Link to='/createpoll'>
            <Button
              primary
              className='buttonStyle'
              className='blueMatch'
            >
              Create Ballot
            </Button>
          </Link>
        </div>
        <div style={{marginLeft: 50, marginRight:50, marginTop: 50}}>
          <div className="ui four link cards">
            {polls.map((poll) =>
              <Poll
              poll={poll}
              handlePollClick = {this.props.handlePollClick}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Dashboard;