import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {stores} from './store/stores';
import {Provider} from 'mobx-react';
import {ApolloProvider} from 'react-apollo-hooks';
import {App} from './app';
import {apolloClient} from './schema/apolloClient';

ReactDOM.render(
  <Provider {...stores}>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </Provider>,
  document.getElementById('root')
);
