import {useEffect,useState} from 'react';
import {savedReadingTranslation} from '../utils/presenterReadingTranslation.js';

// Scope-bound state prevents a previous lesson's English flashing on navigation.
export default function useReadingTranslation(assignmentId,scope) {
  const identity=String(assignmentId||'')+':'+scope;
  const [state,setState]=useState({identity:'',target:null,open:false});
  useEffect(()=>{setState({identity,target:null,open:false});},[identity]);
  const target=state.identity===identity?state.target:null;
  const english=target?savedReadingTranslation(assignmentId,target.section,target.text):'';
  function select(next){
    setState(previous=>({identity,target:next,open:previous.identity===identity && previous.open}));
  }
  function toggle(){
    if(!target || !english)return;
    setState(previous=>({...previous,open:!previous.open}));
  }
  return {target,english,open:Boolean(target && english && state.identity===identity && state.open),select,toggle};
}
