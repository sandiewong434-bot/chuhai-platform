import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import ArticleList from './pages/ArticleList'
import ArticleDetail from './pages/ArticleDetail'
import OntologyGraph from './pages/OntologyGraph'
import CountryScore from './pages/CountryScore'
import TradeBarrier from './pages/TradeBarrier'
import EnterpriseTrack from './pages/EnterpriseTrack'
import SourceHealth from './pages/SourceHealth'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        } />
        <Route path="articles" element={
          <ErrorBoundary>
            <ArticleList />
          </ErrorBoundary>
        } />
        <Route path="articles/:id" element={
          <ErrorBoundary>
            <ArticleDetail />
          </ErrorBoundary>
        } />
        <Route path="ontology" element={
          <ErrorBoundary>
            <OntologyGraph />
          </ErrorBoundary>
        } />
        <Route path="scores" element={
          <ErrorBoundary>
            <CountryScore />
          </ErrorBoundary>
        } />
        <Route path="barriers" element={
          <ErrorBoundary>
            <TradeBarrier />
          </ErrorBoundary>
        } />
        <Route path="enterprises" element={
          <ErrorBoundary>
            <EnterpriseTrack />
          </ErrorBoundary>
        } />
        <Route path="sources" element={
          <ErrorBoundary>
            <SourceHealth />
          </ErrorBoundary>
        } />
      </Route>
    </Routes>
  )
}

export default App
