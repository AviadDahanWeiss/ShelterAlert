import type { CalendarEvent, AttendeeMapping } from '@/types';

/** Generate an ISO dateTime string for today at a given hour:minute offset from now */
function todayAt(offsetMinutes: number): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toISOString();
}

// Area names MUST match cities.json name_en exactly so toHebrewAreaName() can
// resolve them to the Hebrew strings that Pikud HaOref returns in alerts.
export const DEMO_MAPPINGS: AttendeeMapping[] = [
  { name: 'Yael Cohen',    email: 'yael.cohen@demo.local',   area: 'Tel Aviv - City Center' },
  { name: 'Oren Levi',     email: 'oren.levi@demo.local',    area: 'Beer Sheva - North' },
  { name: 'Dana Mizrahi',  email: 'dana.mizrahi@demo.local', area: 'Jerusalem - Center' },
  { name: 'Roni Shapiro',  email: 'roni.shapiro@demo.local', area: 'Haifa - Carmel, Hadar And Downtown Lower City' },
  { name: 'Tal Katz',      email: 'tal.katz@demo.local',     area: 'Kiryat Shmona' },
  { name: 'Mia Peretz',    email: 'mia.peretz@demo.local',   area: 'Eilat' },
  { name: 'Avi Goldstein', email: 'avi.goldstein@demo.local',area: 'Ashdod - Alef, Bet, Dalet, Heh' },
  { name: 'Noa Friedman',  email: 'noa.friedman@demo.local', area: 'Netanya - East' },
  { name: 'Elan Bar',      email: 'elan.bar@demo.local',     area: 'Rishon LeZion - East' },
  { name: 'Shai Avraham',  email: 'shai.avraham@demo.local', area: 'Ramat Gan - East' },
];

export function getDemoEvents(): CalendarEvent[] {
  return [
    {
      id: 'demo-1',
      summary: 'Weekly Team Standup',
      start: { dateTime: todayAt(-45), timeZone: 'Asia/Jerusalem' },
      end:   { dateTime: todayAt(-15), timeZone: 'Asia/Jerusalem' },
      attendees: [
        { email: 'yael.cohen@demo.local',   displayName: 'Yael Cohen',   responseStatus: 'accepted' },
        { email: 'oren.levi@demo.local',    displayName: 'Oren Levi',    responseStatus: 'accepted' },
        { email: 'dana.mizrahi@demo.local', displayName: 'Dana Mizrahi', responseStatus: 'accepted' },
      ],
    },
    {
      id: 'demo-2',
      summary: 'Product Roadmap Review',
      start: { dateTime: todayAt(25), timeZone: 'Asia/Jerusalem' },
      end:   { dateTime: todayAt(85), timeZone: 'Asia/Jerusalem' },
      attendees: [
        { email: 'roni.shapiro@demo.local',  displayName: 'Roni Shapiro',  responseStatus: 'accepted' },
        { email: 'tal.katz@demo.local',      displayName: 'Tal Katz',      responseStatus: 'accepted' },
        { email: 'mia.peretz@demo.local',    displayName: 'Mia Peretz',    responseStatus: 'tentative' },
        { email: 'avi.goldstein@demo.local', displayName: 'Avi Goldstein', responseStatus: 'accepted' },
      ],
    },
    {
      id: 'demo-3',
      summary: 'Client Demo Call',
      start: { dateTime: todayAt(150), timeZone: 'Asia/Jerusalem' },
      end:   { dateTime: todayAt(210), timeZone: 'Asia/Jerusalem' },
      attendees: [
        { email: 'noa.friedman@demo.local', displayName: 'Noa Friedman', responseStatus: 'accepted' },
        { email: 'elan.bar@demo.local',     displayName: 'Elan Bar',     responseStatus: 'accepted' },
        { email: 'shai.avraham@demo.local', displayName: 'Shai Avraham', responseStatus: 'needsAction' },
      ],
    },
  ];
}
