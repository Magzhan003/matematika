// HashRouter (#/formulas) so the app also works when opened as a local .html file.
import { Cheatsheet } from './pages/Cheatsheet'
import { Geometry } from './pages/Geometry'
import { Journal } from './pages/Journal'
import { Work } from './pages/Work'
import { WordProblems } from './pages/WordProblems'
import { HashRouter as BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
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
            <Route path="review" element={<Review />} />
            <Route path="teacher" element={<Teacher />} />
            <Route path="journal" element={<Journal />} />
            <Route path="work" element={<Work />} />
            <Route path="cheatsheet" element={<Cheatsheet />} />
            <Route path="geometry" element={<Geometry />} />
            <Route path="word" element={<WordProblems />} />
            <Route path="game/:id/:level" element={<Game />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
