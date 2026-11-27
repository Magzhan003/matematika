// HashRouter (#/formulas) so the app also works when opened as a local .html file.
import { ClassTools } from './pages/ClassTools'
import { Solids } from './pages/Solids'
import { Olympiad } from './pages/Olympiad'
import { Worksheets } from './pages/Worksheets'
import { Materials } from './pages/Materials'
import { Summative } from './pages/Summative'
import { Scenario } from './pages/Scenario'
import { EntPlan } from './pages/EntPlan'
import { Textbook } from './pages/Textbook'
import { Portfolio } from './pages/Portfolio'
import { Classes } from './pages/Classes'
import { MyTasks } from './pages/MyTasks'
import { Cheatsheet } from './pages/Cheatsheet'
import { Geometry } from './pages/Geometry'
import { Diagnostic } from './pages/Diagnostic'
import { Journal } from './pages/Journal'
import { KnowledgeMap } from './pages/KnowledgeMap'
import { Practice } from './pages/Practice'
import { Program } from './pages/Program'
import { Report } from './pages/Report'
import { Work } from './pages/Work'
import { WordProblems } from './pages/WordProblems'
import { HashRouter as BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RoleProvider } from './lib/role'
import { CloudProvider } from './lib/cloud'
import { StoreProvider } from './lib/store'
import { Calculator } from './pages/Calculator'
import { Formulas } from './pages/Formulas'
import { Ent } from './pages/Ent'
import { Game } from './pages/Game'
import { Games } from './pages/Games'
import { Home } from './pages/Home'
import { Lesson } from './pages/Lesson'
import { Lessons } from './pages/Lessons'
import { Test } from './pages/Test'
import { Progress } from './pages/Progress'
import { Review } from './pages/Review'
import { Teacher } from './pages/Teacher'

/** Routes: home, formulas, calculator, lessons (+ lesson player, tests), progress, games. */
export default function App() {
  return (
    <StoreProvider>
      <CloudProvider>
      <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="formulas" element={<Formulas />} />
            <Route path="calculator" element={<Calculator />} />
            <Route path="lessons" element={<Lessons />} />
            <Route path="lesson/:id" element={<Lesson />} />
            <Route path="test/:scope/:level" element={<Test />} />
            <Route path="progress" element={<Progress />} />
            <Route path="games" element={<Games />} />
            <Route path="ent" element={<Ent />} />
            <Route path="ent-plan" element={<EntPlan />} />
            <Route path="textbook" element={<Textbook />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="classes" element={<Classes />} />
            <Route path="tasks" element={<MyTasks />} />
            <Route path="review" element={<Review />} />
            <Route path="teacher" element={<Teacher />} />
            <Route path="journal" element={<Journal />} />
            <Route path="classroom" element={<ClassTools />} />
            <Route path="solids" element={<Solids />} />
            <Route path="olympiad" element={<Olympiad />} />
            <Route path="worksheets" element={<Worksheets />} />
            <Route path="materials" element={<Materials />} />
            <Route path="summative" element={<Summative />} />
            <Route path="scenario" element={<Scenario />} />
            <Route path="work" element={<Work />} />
            <Route path="cheatsheet" element={<Cheatsheet />} />
            <Route path="geometry" element={<Geometry />} />
            <Route path="word" element={<WordProblems />} />
            <Route path="diagnostic" element={<Diagnostic />} />
            <Route path="map" element={<KnowledgeMap />} />
            <Route path="program" element={<Program />} />
            <Route path="report" element={<Report />} />
            <Route path="practice/:topic" element={<Practice />} />
            <Route path="game/:id/:level" element={<Game />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </RoleProvider>
      </CloudProvider>
    </StoreProvider>
  )
}
