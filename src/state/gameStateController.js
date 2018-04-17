const reducer = require('./reducer');
const { initialState } = require('./initialState');
const actions = require('./actions');

const tickCombine = require('../ticks/tickCombine');

function createGameController(player, socket, serverDelay, serverOffset, startingGameTime) {
    let actionID = 0;
    initialState.gameTime = startingGameTime;
    let history = [initialState];

    socket.on('serverAction', (action) => {
        const currentTime = Date.now();
        if (action.player === player) {
            serverDelay = (currentTime - action.atPlayerTime) / 2;
            history = history;
        }
    })
    
    function decorateAction(action, time) {
        return {...action, atPlayerTime: time, player, id: actionID += 1};
    }

    return {
        initiateAction(action) {
            action.player = player;
            let currentTime = Date.now();
            action = decorateAction(action, currentTime);
            socket.emit('clientAction', action);
            action.atServerTime = currentTime - serverDelay + serverOffset;
            const nextState = reducer(history[history.length - 1], action);
            history.push(nextState);
        },

        currentState(){
            let gameTime = Date.now() - serverDelay + serverOffset;
            console.log('Inside currentState (gameController): State: ', history[history.length - 1], gameTime);
            return tickCombine(history[history.length - 1], gameTime);
        }
    }
}

module.exports = createGameController;