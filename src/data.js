// Demo data for the CrossWay for Business prototype. Everything is static; no backend.
export const NAV=[['home','Home','home'],['book','Book','event_available'],['live','Live','sensors'],['timesheets','Timesheets','fact_check'],['hiring','Hiring','person_search'],['workers','Workers','groups'],['invoices','Invoices','receipt_long'],['payroll','Payroll','payments'],['vault','Vault','folder_managed'],['support','Support','support_agent'],['team','Team','admin_panel_settings']];
export const ROLES=[{id:'owner',label:'Account Owner',s:NAV.map(n=>n[0]),limit:Infinity},{id:'hr',label:'HR Manager',s:['home','book','live','timesheets','hiring','workers','payroll','vault','support'],limit:50000},{id:'site',label:'Site Manager',s:['home','book','live','timesheets','workers','support'],limit:15000},{id:'finance',label:'Finance',s:['home','invoices','payroll','vault','support'],limit:0},{id:'interviewer',label:'Interviewer',s:['hiring'],limit:0}];
export const T={ok:['var(--ok-bg)','var(--ok-fg)'],warn:['var(--warn-bg)','var(--warn-fg)'],bad:['var(--bad-bg)','var(--bad-fg)'],info:['var(--primary-soft)','var(--primary-dark)'],mute:['var(--surface-3)','var(--muted)']};
export const NFG={ok:'var(--muted)',warn:'var(--warn-text)',bad:'var(--danger)',info:'var(--primary)',mute:'var(--muted)'};
export const AV=['#4285F4','#34A853','#FBBC04','#EA4335','#0B57D0','#146C2E'];
export const RATES={waiter:{label:'Waiter / steward',r:210,pay:145,sup:{Indiranagar:9,Koramangala:14,'HSR Layout':6}},kitchen:{label:'Kitchen helper',r:190,pay:130,sup:{Indiranagar:12,Koramangala:10,'HSR Layout':8}},cleaner:{label:'Housekeeping',r:180,pay:125,sup:{Indiranagar:15,Koramangala:11,'HSR Layout':9}},barista:{label:'Barista',r:230,pay:160,sup:{Indiranagar:4,Koramangala:6,'HSR Layout':3}},cashier:{label:'Cashier',r:220,pay:150,sup:{Indiranagar:5,Koramangala:7,'HSR Layout':4}}};
export const DATES=[{id:'d0',label:'Today · Sat 18 Oct',dow:'Sat',day:'18',today:true},{id:'d1',label:'Tomorrow · Sun 19 Oct',dow:'Sun',day:'19'},{id:'d2',label:'Fri 24 Oct',dow:'Fri',day:'24'},{id:'d3',label:'Sat 25 Oct',dow:'Sat',day:'25'},{id:'d4',label:'Fri 31 Oct · Diwali eve',dow:'Fri',day:'31',peak:true}];
export const NOW=16.33;
export const HOURS=Array.from({length:24},(_,i)=>({v:String(i),l:(i%12||12)+':00 '+(i<12?'am':'pm')}));
export const ini=n=>n.split(' ').map(w=>w[0]).join('').slice(0,2);
export const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
export const LIVE=[
{id:'l1',name:'Ravi Kumar',role:'Waiter',loc:'Indiranagar',time:'12:00–20:00',status:'On site',sev:'ok',note:'Checked in 11:56 · selfie verified'},
{id:'l2',name:'Shabana K.',role:'Kitchen helper',loc:'Indiranagar',time:'12:00–20:00',status:'On site',sev:'ok',note:'Checked in 12:02'},
{id:'l3',name:'Kiran B.',role:'Barista',loc:'Koramangala',time:'16:00–22:00',status:'Late',sev:'warn',note:'18 min late. Last seen 4 km away. A backup is on standby.',kind:'late'},
{id:'l4',name:'Neha P.',role:'Cashier',loc:'HSR Layout',time:'15:30–21:30',status:'Absent',sev:'bad',note:'Did not check in. Free replacement window ends at 16:15. You are not billed for this slot.',kind:'absent'},
{id:'l5',name:'Arun T.',role:'Kitchen helper',loc:'Koramangala',time:'15:30–23:30',status:'Replacement',sev:'info',note:'Replacing Suresh M. ETA 9 min. Billed from actual check-in.',kind:'enroute'},
{id:'l6',name:'Deepa R.',role:'Waiter',loc:'HSR Layout',time:'17:00–23:00',status:'Starts 17:00',sev:'mute',note:'Confirmed · women-safety cab home booked (shift ends 23:00)',kind:'upcoming'}];
export const TS=[
{id:'t1',name:'Ravi Kumar',role:'Waiter',loc:'Indiranagar',date:'17 Oct',inout:'In 11:58 · Out 20:04',hours:'8.0 h',max:8,note:'Clean',sev:'ok'},
{id:'t2',name:'Shabana K.',role:'Kitchen helper',loc:'Indiranagar',date:'17 Oct',inout:'In 12:00 · Out 20:00',hours:'8.0 h',max:8,note:'Clean',sev:'ok'},
{id:'t3',name:'Lakshmi Devi',role:'Housekeeping',loc:'Koramangala',date:'17 Oct',inout:'In 07:02 · Out 18:30',hours:'8 h + 3.5 h OT',max:11.5,note:'Overtime wasn\'t pre-approved. Approve or reduce it individually.',sev:'warn',ot:true},
{id:'t4',name:'Kiran B.',role:'Barista',loc:'Koramangala',date:'17 Oct',inout:'In 16:02 · Out 22:04',hours:'6.0 h',max:6,note:'Clean',sev:'ok'},
{id:'t5',name:'Manjunath S.',role:'Waiter',loc:'HSR Layout',date:'15 Oct',inout:'In 10:00 · Out 18:00',hours:'8.0 h',max:8,note:'Dispute window closed. Auto-approved on 17 Oct.',sev:'mute',locked:true}];
export const PIPE={short:[{id:'c1',name:'Arvind Rao',sub:'7 yrs · ex-Barbeque Nation',note:'AI interview 4.2/5 · match 88',sev:'ok',st:'short'},{id:'c2',name:'Meghna S.',sub:'5 yrs · ex-Chai Point',note:'Background check pending. You can interview; offer unlocks when cleared.',sev:'warn',st:'short',bgv:true}],
inter:[{id:'c3',name:'Farhan Ali',sub:'6 yrs · ex-Social',note:'Video interview today 18:30 · panel: Neha, Rahul',sev:'info',st:'inter'},{id:'c4',name:'Tanvi M.',sub:'4 yrs',note:'Missed yesterday\'s interview. Said phone was off.',sev:'warn',st:'inter',missed:true}],
offer:[{id:'c5',name:'Joseph D.',sub:'8 yrs · ₹52,000/month',note:'Offer sent 3 days ago. Expires tomorrow 18:00.',sev:'warn',st:'offer'},{id:'c6',name:'Ritu K.',sub:'6 yrs',note:'Declined: accepted a counter-offer. 30-day replacement applies.',sev:'bad',st:'offer',declined:true}],
joined:[{id:'c7',name:'Sameer P.',sub:'Joined 1 Oct · Indiranagar',note:'Day 17 of 30. Attrition risk low. 30-day check-in on 31 Oct.',sev:'ok',st:'joined'}]};
export const WORKERS=[{id:'w1',name:'Ravi Kumar',role:'Waiter',shifts:24,rel:94,rating:5,fav:true},{id:'w2',name:'Shabana K.',role:'Kitchen helper',shifts:18,rel:92,rating:4,fav:true},{id:'w3',name:'Kiran B.',role:'Barista',shifts:9,rel:81,rating:3,fav:false},{id:'w4',name:'Deepa R.',role:'Waiter',shifts:6,rel:89,rating:4,fav:false},{id:'w5',name:'Rahul D.',role:'Waiter',shifts:3,rel:72,rating:2,fav:false,blocked:true}];
export const INV=[{id:'i1',no:'INV-26-1062',desc:'Shift staffing · 6–12 Oct · 41 shifts',amt:'₹1,18,420',v:118420,status:'Due in 4 days',sev:'info',pay:true},{id:'i2',no:'INV-26-1049',desc:'Shift staffing · 29 Sep–5 Oct',amt:'₹96,300',v:96300,status:'Overdue 3 days',sev:'bad',pay:true},{id:'i3',no:'INV-26-1058',desc:'Includes 1 disputed line (2.0 h)',amt:'₹12,400',v:12400,status:'On hold · dispute',sev:'warn'},{id:'i4',no:'CN-26-0118',desc:'Credit note · no-show 12 Oct',amt:'−₹1,800',v:0,status:'Applied',sev:'ok'},{id:'i5',no:'INV-26-1012',desc:'Placement fee · Sameer P.',amt:'₹62,000',v:0,status:'Paid',sev:'ok'}];
export const TEAM=[{id:'u1',name:'Neha Kapoor',role:'Account Owner',scope:'All outlets',limit:'No limit'},{id:'u2',name:'Rahul Menon',role:'HR Manager',scope:'All outlets',limit:'₹50,000 per booking'},{id:'u3',name:'Anil S.',role:'Site Manager',scope:'HSR Layout',limit:'₹15,000 per booking'},{id:'u4',name:'Kavitha R.',role:'Finance',scope:'Invoices and payroll',limit:'Cannot book'}];
export const BOOKINGS=[{id:'b1',dow:'Sun',day:'19',count:4,role:'Waiter / steward',loc:'Koramangala',time:'11:00 am–7:00 pm',total:'₹31,718',status:'Crew confirmed',sev:'ok'},{id:'b2',dow:'Fri',day:'31',count:8,role:'Kitchen helper',loc:'Indiranagar',time:'4:00 pm–12:00 am',total:'₹86,092',status:'Finding crew · 5 of 8',sev:'warn'}];
export const LOCS=['Indiranagar','Koramangala','HSR Layout'];

/** Price and rule checks for a booking form, mirroring the design's pricing model. */
export function quote(f){
  const r=RATES[f.role],d=DATES.find(x=>x.id===f.date);
  const st=+f.start,en=+f.end;let hrs=en-st;if(hrs<=0)hrs+=24;
  const past=!!d.today&&st<=NOW;const urgent=!!d.today&&!past&&st-NOW<4;
  const night=en===0||en>22||en<=6;const peak=!!d.peak;
  const base=r.r*hrs*f.count;const sur=urgent?base*.2:peak?base*.15:0;const sub=base+sur;const gst=sub*.18;const occ=f.recurring?4:1;const total=(sub+gst)*occ;
  return {r,d,hrs,past,urgent,night,peak,base,sur,sub,gst,total,occ,supply:r.sup[f.loc],long:hrs>12};
}
