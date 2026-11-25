const matchInfo = document.querySelector('#match-info')
let timer
let loading = false

function matchLine(events, now) {
  const matches = events.map(event => event.competitions[0])
    .filter(match => match?.competitors?.some(side => side.id === '103'))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  const live = matches.find(match => match.status.type.state === 'in')
  if (live) {
    const sides = ['home', 'away'].map(venue => live.competitors.find(side => side.homeAway === venue))
    const [home, away] = sides
    const score = side => side.score?.displayValue ?? side.score?.value ?? '–'
    return ['Live · ' + home.team.displayName + ' ' + score(home) + '–' + score(away) + ' ' + away.team.displayName + ' · ' + (live.status.type.shortDetail || live.status.displayClock), 30000]
  }
  const next = matches.find(match => match.status.type.state === 'pre' &&
    match.status.type.name === 'STATUS_SCHEDULED' && Date.parse(match.date) >= now - 60000)
  if (!next) return ['See match schedule', 60000]
  const opponent = next.competitors.find(side => side.id !== '103')
  const date = new Date(next.date)
  const options = {month:'short', day:'numeric'}
  if (next.timeValid) Object.assign(options, {hour:'numeric', minute:'2-digit', timeZoneName:'short'})
  const kickoff = new Intl.DateTimeFormat(undefined, options).format(date)
  return ['Next match ' + (opponent.homeAway === 'home' ? 'at ' : 'vs. ') + opponent.team.displayName + ' · ' + kickoff, Date.parse(next.date) - now < 3600000 ? 30000 : 300000]
}

async function refresh() {
  clearTimeout(timer)
  if (document.hidden || loading) return
  loading = true
  let delay = 60000
  try {
    const response = await fetch('https://dennis-gega-milan-feed.deftvine3.chatgpt.site/api/milan', {signal: AbortSignal.timeout(15000)})
    if (!response.ok) throw new Error('Schedule unavailable')
    const [line, interval] = matchLine(await response.json(), Date.now())
    matchInfo.textContent = line
    delay = interval
  } catch {
    matchInfo.textContent = 'Live updates unavailable · Match schedule'
  } finally {
    loading = false
    if (!document.hidden) timer = setTimeout(refresh, delay)
  }
}
document.addEventListener('visibilitychange', refresh)
refresh()
