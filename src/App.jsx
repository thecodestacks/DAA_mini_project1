import { useEffect, useMemo, useRef, useState } from 'react'

const LOCATIONS = [
  'College',
  'Library',
  'Hospital',
  'Bus Stand',
  'Railway Station',
  'Airport',
  'Shopping Mall',
]

const ROADS = [
  ['College', 'Library', 4],
  ['College', 'Hospital', 2],
  ['Library', 'Bus Stand', 5],
  ['Hospital', 'Bus Stand', 1],
  ['Hospital', 'Railway Station', 8],
  ['Bus Stand', 'Railway Station', 3],
  ['Railway Station', 'Airport', 2],
  ['Bus Stand', 'Shopping Mall', 4],
  ['Shopping Mall', 'Airport', 6],
]

const NODE_POSITIONS = {
  College: { x: 90, y: 80 },
  Library: { x: 250, y: 70 },
  Hospital: { x: 210, y: 200 },
  'Bus Stand': { x: 390, y: 185 },
  'Railway Station': { x: 545, y: 120 },
  Airport: { x: 685, y: 180 },
  'Shopping Mall': { x: 520, y: 300 },
}

const DOCUMENTATION = {
  Abstract:
    'Smart Route Finder demonstrates how Dijkstra\'s Algorithm solves shortest-path problems in weighted graphs. The project models key city locations, calculates optimal travel routes, and presents algorithmic insights through an interactive dashboard.',
  Objectives:
    'Visualize graph-based route planning, compute shortest paths between selected nodes, explain algorithm steps for learning, and deliver a responsive mini-project suitable for DAA demonstrations and viva presentations.',
  'Existing System':
    'Traditional route explanation in classrooms is static and difficult to visualize. Manual shortest-path calculations are time-consuming and do not clearly show how node exploration changes over time.',
  'Proposed System':
    'A modern web application that uses Dijkstra\'s Algorithm to compute and display shortest routes, distances, visited nodes, traversal steps, and a dynamic graph with highlighted optimal paths.',
  'System Architecture':
    'User Input (source/destination) → Graph Builder → Dijkstra Engine (priority queue) → Result Formatter → Visualization & History Panels. A dark-mode ready React UI presents all outputs.',
  'Algorithm Used':
    'Dijkstra\'s Algorithm repeatedly picks the unvisited node with minimum tentative distance, relaxes neighboring edges, updates distances and predecessors, then reconstructs the shortest path from destination back to source.',
  Flowchart: `START
↓
Select Source and Destination
↓
Create Graph
↓
Apply Dijkstra Algorithm
↓
Find Shortest Path
↓
Display Route and Distance
↓
END`,
  'Future Enhancements':
    'Integrate live map APIs, allow dynamic graph editing, add traffic-aware weights, include multiple algorithm comparisons (A*, Bellman-Ford), and support voice-guided route simulation.',
  Conclusion:
    'The project successfully bridges algorithm theory and practical navigation by showing how shortest-path decisions are computed and visualized in real time, making Dijkstra easier to understand and apply.',
}

class MinHeap {
  constructor() {
    this.items = []
  }

  push(value) {
    this.items.push(value)
    this.bubbleUp(this.items.length - 1)
  }

  pop() {
    if (!this.items.length) {
      return null
    }

    const top = this.items[0]
    const last = this.items.pop()

    if (this.items.length && last) {
      this.items[0] = last
      this.bubbleDown(0)
    }

    return top
  }

  bubbleUp(index) {
    let current = index

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2)
      if (this.items[parent].distance <= this.items[current].distance) {
        break
      }

      ;[this.items[parent], this.items[current]] = [
        this.items[current],
        this.items[parent],
      ]
      current = parent
    }
  }

  bubbleDown(index) {
    let current = index

    while (true) {
      const left = current * 2 + 1
      const right = current * 2 + 2
      let smallest = current

      if (
        left < this.items.length &&
        this.items[left].distance < this.items[smallest].distance
      ) {
        smallest = left
      }

      if (
        right < this.items.length &&
        this.items[right].distance < this.items[smallest].distance
      ) {
        smallest = right
      }

      if (smallest === current) {
        break
      }

      ;[this.items[current], this.items[smallest]] = [
        this.items[smallest],
        this.items[current],
      ]
      current = smallest
    }
  }

  isEmpty() {
    return this.items.length === 0
  }
}

const createGraph = (locations, roads) => {
  const graph = new Map(locations.map((location) => [location, []]))

  roads.forEach(([from, to, distance]) => {
    graph.get(from).push({ node: to, distance })
    graph.get(to).push({ node: from, distance })
  })

  return graph
}

const dijkstra = (graph, source, destination) => {
  const startTime = performance.now()

  const distances = new Map()
  const previous = new Map()
  const visited = new Set()
  const visitedOrder = []
  const traversalSteps = []

  for (const node of graph.keys()) {
    distances.set(node, Infinity)
    previous.set(node, null)
  }

  distances.set(source, 0)

  const queue = new MinHeap()
  queue.push({ node: source, distance: 0 })

  while (!queue.isEmpty()) {
    const current = queue.pop()

    if (!current || visited.has(current.node)) {
      continue
    }

    visited.add(current.node)
    visitedOrder.push(current.node)

    if (current.node === destination) {
      break
    }

    const neighbors = graph.get(current.node) ?? []
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.node)) {
        continue
      }

      const newDistance = distances.get(current.node) + neighbor.distance
      traversalSteps.push(
        `From ${current.node}, checking ${neighbor.node} (${neighbor.distance} km)`
      )

      if (newDistance < distances.get(neighbor.node)) {
        distances.set(neighbor.node, newDistance)
        previous.set(neighbor.node, current.node)
        queue.push({ node: neighbor.node, distance: newDistance })
      }
    }
  }

  const path = []
  if (distances.get(destination) !== Infinity) {
    let currentNode = destination
    while (currentNode) {
      path.unshift(currentNode)
      currentNode = previous.get(currentNode)
    }
  }

  const endTime = performance.now()

  return {
    path,
    totalDistance: distances.get(destination),
    visitedNodes: visitedOrder,
    traversalSteps,
    executionTimeMs: Number((endTime - startTime).toFixed(3)),
  }
}

function App() {
  const [source, setSource] = useState('College')
  const [destination, setDestination] = useState('Airport')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('smart-route-theme')
    return savedTheme ? savedTheme === 'dark' : false
  })
  const [started, setStarted] = useState(false)
  const [activeDoc, setActiveDoc] = useState('Abstract')
  const [animationStep, setAnimationStep] = useState(0)

  const graph = useMemo(() => createGraph(LOCATIONS, ROADS), [])
  const routeFinderRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('smart-route-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!result?.path?.length) {
      return undefined
    }

    const interval = setInterval(() => {
      setAnimationStep((prev) => {
        if (prev >= result.path.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 500)

    return () => clearInterval(interval)
  }, [result])

  const pathEdges = useMemo(() => {
    if (!result?.path?.length) {
      return new Set()
    }

    const edges = new Set()
    for (let index = 0; index < result.path.length - 1; index += 1) {
      const first = result.path[index]
      const second = result.path[index + 1]
      edges.add([first, second].sort().join('::'))
    }
    return edges
  }, [result])

  const handleStart = () => {
    setStarted(true)
    setTimeout(() => routeFinderRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleFindRoute = () => {
    if (!source || !destination || source === destination) {
      return
    }

    const calculated = dijkstra(graph, source, destination)
    setAnimationStep(0)
    setResult(calculated)

    if (calculated.path.length) {
      setHistory((previousHistory) => [
        {
          id: `${Date.now()}`,
          source,
          destination,
          distance: calculated.totalDistance,
          path: calculated.path,
          visited: calculated.visitedNodes.length,
          time: calculated.executionTimeMs,
          timestamp: new Date().toLocaleString(),
        },
        ...previousHistory.slice(0, 6),
      ])
    }
  }

  const handleReset = () => {
    setSource('College')
    setDestination('Airport')
    setResult(null)
    setAnimationStep(0)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <header className="relative overflow-hidden border-b border-slate-300/70 bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 px-6 py-16 text-white dark:border-slate-700">
        <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_top_right,_white_1px,_transparent_1px)] [background-size:24px_24px]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
              Design and Analysis of Algorithms Mini Project
            </span>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              GPS Route Finder Using Dijkstra&apos;s Algorithm
            </h1>
            <p className="text-sm text-blue-50 md:text-base">
              Dijkstra&apos;s Algorithm finds the shortest path in weighted graphs by always
              choosing the nearest unexplored node first. This dashboard demonstrates how
              modern navigation systems compute efficient routes.
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-sky-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50"
            >
              Start Route Finder
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            className="self-start rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/20"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section
          ref={routeFinderRef}
          className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm transition dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Smart Route Finder</h2>
            {started && (
              <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Ready for demonstration
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Source
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              >
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Destination
              <select
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              >
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleFindRoute}
              disabled={source === destination}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400 md:mt-auto"
            >
              Find Shortest Path
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800 md:mt-auto"
            >
              Reset
            </button>
          </div>

          {result && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <h3 className="mb-3 text-lg font-semibold">Result</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Source:</span> {source}
                  </p>
                  <p>
                    <span className="font-semibold">Destination:</span> {destination}
                  </p>
                  <p>
                    <span className="font-semibold">Shortest Path:</span>{' '}
                    {result.path.length ? result.path.join(' → ') : 'No route found'}
                  </p>
                  <p>
                    <span className="font-semibold">Total Distance:</span>{' '}
                    {result.totalDistance === Infinity ? '∞' : `${result.totalDistance} km`}
                  </p>
                  <p>
                    <span className="font-semibold">Nodes Visited:</span>{' '}
                    {result.visitedNodes.length}
                  </p>
                  <p>
                    <span className="font-semibold">Execution Time:</span>{' '}
                    {result.executionTimeMs} ms
                  </p>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <h3 className="mb-3 text-lg font-semibold">Route Traversal Process</h3>
                <ul className="max-h-44 space-y-2 overflow-auto pr-2 text-sm">
                  {result.traversalSteps.map((step, index) => (
                    <li
                      key={`${step}-${index}`}
                      className="rounded-md bg-white p-2 opacity-0 shadow-sm transition-all dark:bg-slate-900"
                      style={{
                        animation: 'fadeIn 0.35s ease forwards',
                        animationDelay: `${Math.min(index * 0.05, 1.2)}s`,
                      }}
                    >
                      {step}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm">
                  <span className="font-semibold">Visited Nodes:</span>{' '}
                  {result.visitedNodes.join(', ')}
                </p>
              </article>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-semibold">Road Network Graph</h2>
          <div className="overflow-auto">
            <svg viewBox="0 0 760 360" className="min-w-[700px] rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
              {ROADS.map(([from, to, distance]) => {
                const start = NODE_POSITIONS[from]
                const end = NODE_POSITIONS[to]
                const edgeKey = [from, to].sort().join('::')
                const highlighted = pathEdges.has(edgeKey)

                return (
                  <g key={`${from}-${to}`}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      className={highlighted ? 'stroke-emerald-500' : 'stroke-slate-400'}
                      strokeWidth={highlighted ? 5 : 3}
                      strokeLinecap="round"
                    />
                    <text
                      x={(start.x + end.x) / 2}
                      y={(start.y + end.y) / 2 - 6}
                      textAnchor="middle"
                      className="fill-slate-600 text-[12px] font-semibold dark:fill-slate-200"
                    >
                      {distance} km
                    </text>
                  </g>
                )
              })}

              {LOCATIONS.map((location) => {
                const point = NODE_POSITIONS[location]
                const inPath = result?.path?.includes(location)
                const isAnimatedPathNode = inPath && result.path.indexOf(location) <= animationStep
                const visited = result?.visitedNodes?.includes(location)

                return (
                  <g key={location}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="22"
                      className={
                        isAnimatedPathNode
                          ? 'fill-emerald-500'
                          : visited
                            ? 'fill-sky-500'
                            : 'fill-slate-600'
                      }
                    />
                    <text
                      x={point.x}
                      y={point.y + 5}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-semibold"
                    >
                      {location.length > 11 ? `${location.slice(0, 10)}…` : location}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Green lines show the shortest path, blue nodes indicate visited locations.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <article className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-semibold">Educational Section</h2>
            <div className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
              <p>
                <span className="font-semibold">What is Dijkstra&apos;s Algorithm?</span> It is a
                greedy graph algorithm used to find the shortest path from a source node to
                all other nodes when edge weights are non-negative.
              </p>
              <p>
                <span className="font-semibold">Working Principle:</span> Initialize source
                distance as 0, all others as infinity, repeatedly pick the nearest unvisited
                node, relax outgoing edges, and continue until destination is finalized.
              </p>
              <p>
                <span className="font-semibold">Time Complexity:</span> O((V + E) log V)
              </p>
              <p>
                <span className="font-semibold">Space Complexity:</span> O(V)
              </p>
              <div>
                <p className="font-semibold">Real-world Applications:</p>
                <ul className="ml-6 list-disc">
                  <li>GPS Navigation</li>
                  <li>Google Maps</li>
                  <li>Network Routing</li>
                  <li>Delivery Route Optimization</li>
                  <li>Transportation Systems</li>
                </ul>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Route History</h2>
              <button
                type="button"
                onClick={() => setHistory([])}
                className="text-xs font-semibold text-rose-600 transition hover:text-rose-500"
              >
                Clear
              </button>
            </div>
            {!history.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                No routes yet. Calculate a path to store history.
              </p>
            ) : (
              <ul className="max-h-64 space-y-3 overflow-auto pr-1 text-sm">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <p className="font-semibold">
                      {entry.source} → {entry.destination}
                    </p>
                    <p>{entry.path.join(' → ')}</p>
                    <p>
                      {entry.distance} km • {entry.visited} nodes • {entry.time} ms
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {entry.timestamp}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-semibold">Project Documentation</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.keys(DOCUMENTATION).map((section) => (
              <button
                type="button"
                key={section}
                onClick={() => setActiveDoc(section)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeDoc === section
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
          {activeDoc === 'Flowchart' ? (
            <pre className="rounded-lg bg-slate-100 p-4 text-sm leading-7 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {DOCUMENTATION[activeDoc]}
            </pre>
          ) : (
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
              {DOCUMENTATION[activeDoc]}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
