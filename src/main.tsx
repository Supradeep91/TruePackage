import {StrictMode,Component,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import posthog from 'posthog-js';
import App from './App.tsx';
import './index.css';

posthog.init('phc_rqtRT8SjM2xHnfXpx55k67nCYGw8mi3MmbAdKziUjkBi',{
  api_host:'https://eu.i.posthog.com',
  capture_pageview:true,
  person_profiles:'always',
});
(window as unknown as Record<string,unknown>).posthog=posthog;

class EB extends Component<{children:ReactNode},{err:string|null}> {
  state={err:null};
  static getDerivedStateFromError(e:Error){return {err:e.message+'\n'+e.stack};}
  render(){
    if(this.state.err) return <pre style={{color:'red',padding:20,whiteSpace:'pre-wrap',fontFamily:'monospace',fontSize:12}}>{this.state.err}</pre>;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EB><App /></EB>
    <Analytics />
  </StrictMode>,
);
