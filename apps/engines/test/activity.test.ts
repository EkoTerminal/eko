import { describe, expect, it } from 'vitest';
import { checkpoints, type Activity, type CoinActivity } from '../src/activity.js';
const coin = '0x0000000000000000000000000000000000000001' as const;
const event = (block:number,sec:number,kind='swap',price=1):Activity => ({coin,block,sec,kind,price,low:price,high:price});
const activity = (events:Activity[]=[]):CoinActivity => ({coin,firstBlock:1,createdSec:0,events,revision:'fixture'});
const clock = (times:number[]) => times.map((sec,i)=>({number:i+1,sec}));
describe('activity checkpoint cadence',()=>{
 it('uses all early checkpoints and switches from ten-minute to hourly cadence',()=>{
  const times=[0,2,10,60,300,900,1500,2100,2700,3300,3900,6900,10500];
  const points=checkpoints(activity([event(1,0)]),clock(times),1,times.length);
  expect(points.map(p=>p.sec)).toEqual([0,2,10,60,300,900,1500,2100,2700,3300,6900,10500]);
 });
 it('stops at seven idle days and resumes on new activity',()=>{
  const times=[0,300,3900,7*86400,7*86400+1,7*86400+2];
  const points=checkpoints(activity([event(5,7*86400+1,'transfer')]),clock(times),1,times.length);
  expect(points.map(p=>p.block)).toEqual([1,2,3,5]);
 });
 it('bounds the plan by FROM/TO while retaining historical price-change triggers',()=>{
  const times=[0,2,10,60,300,301,302];
  const points=checkpoints(activity([event(1,0),event(6,301,'swap',1.04),event(7,302,'swap',1.06)]),clock(times),5,7);
  expect(points.map(p=>p.block)).toEqual([5,7]);
 });
});
