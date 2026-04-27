/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookProvider } from './context/BookContext';
import { SettingsProvider } from './context/SettingsContext';
import { CommunityProvider } from './context/CommunityContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { BookList } from './pages/BookList';
import { BookForm } from './pages/BookForm';
import { BookDetails } from './pages/BookDetails';
import { Gallery } from './pages/Gallery';
import { LiteraryProfile } from './pages/LiteraryProfile';
import { Retrospective } from './pages/Retrospective';
import { Recommendations } from './pages/Recommendations';
import { SearchBooks } from './pages/SearchBooks';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { Community } from './pages/Community';
import { PublicProfile } from './pages/PublicProfile';
import { Timeline } from './pages/Timeline';
import { ExportData } from './pages/ExportData';
import { YearlyComparison } from './pages/YearlyComparison';
import { Quotes } from './pages/Quotes';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BookProvider>
          <CommunityProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="livros" element={<BookList />} />
                    <Route path="pesquisar" element={<SearchBooks />} />
                    <Route path="adicionar" element={<BookForm />} />
                    <Route path="editar/:id" element={<BookForm />} />
                    <Route path="livro/:id" element={<BookDetails />} />
                    <Route path="galeria" element={<Gallery />} />
                    <Route path="perfil-literario" element={<LiteraryProfile />} />
                    <Route path="retrospectiva" element={<Retrospective />} />
                    <Route path="comparativo-anual" element={<YearlyComparison />} />
                    <Route path="citacoes" element={<Quotes />} />
                    <Route path="linha-do-tempo" element={<Timeline />} />
                    <Route path="recomendacoes" element={<Recommendations />} />
                    <Route path="exportar" element={<ExportData />} />
                    <Route path="configuracoes" element={<Settings />} />
                    <Route path="comunidade" element={<Community />} />
                    <Route path="perfil/:userId" element={<PublicProfile />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </CommunityProvider>
        </BookProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

