import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
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
        <Route index element={<Dashboard />} />
        <Route path="articles" element={<ArticleList />} />
        <Route path="articles/:id" element={<ArticleDetail />} />
        <Route path="ontology" element={<OntologyGraph />} />
        <Route path="scores" element={<CountryScore />} />
        <Route path="barriers" element={<TradeBarrier />} />
        <Route path="enterprises" element={<EnterpriseTrack />} />
        <Route path="sources" element={<SourceHealth />} />
      </Route>
    </Routes>
  )
}

export default App
