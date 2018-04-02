const db = require('./index.js');

const createPoll = (orgId, pollOptions) => {
  return db.Poll.create({ 
    orgId: orgId,
    pollName: pollOptions.pollName,
    pollTimeStart: pollOptions.pollStart,
    pollTimeEnd: pollOptions.pollEnd,
    pollHash: pollOptions.pollAddress
  });
};

const createOption = (pollId, optionName) => {
  return db.Option.create({
    optionName: optionName,
    pollId: pollId
  });
};

const saveVoterID = (voteID, pollId) => {
  return db.VoteKey.create({
    voterUniqueId: voteID,
    pollId: pollId
  });
};

const retrievePolls = (orgId) => {
  return new Promise((resolve, reject) => {
    db.sequelize.query(`SELECT p.pollName, DATE_FORMAT(p.pollTimeStart,  '%Y-%m-%d %h:%i %p') as pollTimeStart, 
                        DATE_FORMAT(p.pollTimeEnd,  '%Y-%m-%d %h:%i %p') as pollTimeEnd, p.pollHash, p.pollExpired,
                        p.orgId, GROUP_CONCAT(o.optionName) as options,
                        GROUP_CONCAT(o.id) as optionIds, o.pollId
                        FROM polls p
                        JOIN options o
                        ON o.pollId = p.id
                        WHERE p.orgId = ${orgId} GROUP BY o.pollId;`, { type: db.sequelize.QueryTypes.SELECT})
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const retrieveVoteCount = (optionId) => {
  return new Promise((resolve, reject) => {
    db.Vote.count({ where: { optionId: optionId }})
      .then((count) => {
        resolve(count);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const updateOrgToken = (email, token, expiration) => {
  return new Promise((resolve, reject) => {
    db.Org.update({
      resetToken: token, 
      resetExpiration: expiration
    }, {where: {orgEmail: email}})
    .then(result => {
      resolve(result);
    })
    .catch(err => {
      reject(err);
    })
  })
}

const updatePassword = (token, password) => {
  return new Promise((resolve, reject) => {
    db.Org.update({
      orgPassword: password 
    }, {where: {resetToken: token}})
    .then(result => {
      resolve(result);
    })
    .catch(err => {
      reject(err);
    })
  })
}

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    db.Org.findOne({where: {resetToken: token}})
    .then(org => {
      let date = new Date()
      if (date < org.resetExpiration) {
        resolve(org);
      } else {
        reject('Token expired');
      }
    })
    .catch(err => {
      reject(err);
    })
  })
}

// helper function that takes in a poll object from retrievePolls query
// and bundles it with optionName: voteCounts
const bundlePollVotes = (poll) => {
  return new Promise((resolve, reject) => {
    const promiseArr = [];
    poll.optionIds.split(',').forEach((id) => {
      promiseArr.push(retrieveVoteCount(id));
    });
    Promise.all(promiseArr)
      .then((counts) => {
        const options = poll.options.split(',');
        const optionVotes = [];
        let voteCount = 0;
        counts.forEach((count, index) => {
          let optionCount = {};
          optionCount[options[index]] = count;
          voteCount += count;
          optionVotes.push(optionCount);
        });
        poll.optionVotes = optionVotes;
        poll.voteCount = voteCount;
        resolve(poll);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const submitVote = (hash, optionId, keyId) => {
  return new Promise((resolve, reject) => {
    const promiseArr = [];
    promiseArr.push(db.Vote.create({ voteHash: hash, optionId: optionId, votekeyId: keyId }));
    Promise.all(promiseArr)
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const retrieveCode = (uniqueCode) => {
  return new Promise((resolve, reject) => {
    db.VoteKey.findOne({ where: { voterUniqueId: uniqueCode }, include: [db.Vote, db.Poll]})
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const endPoll = (pollId, pollExpired) => {
  console.log('pollid', pollId)
  return new Promise((resolve, reject) => {
    db.Poll.findOne({ where: { id: pollId } })
      .then((result) => {
        console.log(result);
        if (result) {
          const second = result.update({pollExpired: pollExpired});
          resolve(second);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};


exports.endPoll = endPoll;
exports.createPoll = createPoll;
exports.createOption = createOption;
exports.retrievePolls = retrievePolls;
exports.retrieveVoteCount = retrieveVoteCount;
exports.bundlePollVotes = bundlePollVotes;
exports.saveVoterID = saveVoterID;
exports.updateOrgToken = updateOrgToken;
exports.updatePassword = updatePassword;
exports.verifyToken = verifyToken;
exports.submitVote = submitVote;
exports.retrieveCode = retrieveCode;
