import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileJson, FileText, Filter, AlertCircle, CheckCircle2, Loader2, Calendar, Star, BookOpen, Upload, RefreshCw, X, ChevronRight, Info } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';
import { Book, BookGenre } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { safeParseNumber } from '../lib/statsUtils';

type ExportScope = 'all' | 'read' | 'current_year' | 'specific_year' | 'favorites';
type ImportMode = 'merge' | 'replace';

export const ExportData: React.FC = () => {
  const { books, loading, userGoal, literaryProfile, importData } = useBooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [scope, setScope] = useState<ExportScope>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedGenre, setSelectedGenre] = useState<BookGenre | 'all'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number, ignored: number, goals: number } | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    books.forEach(b => {
      if (b.anoLeitura) years.add(b.anoLeitura);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      // Scope filter
      if (scope === 'read' && book.status !== 'lido') return false;
      if (scope === 'current_year' && book.anoLeitura !== new Date().getFullYear()) return false;
      if (scope === 'specific_year' && book.anoLeitura !== selectedYear) return false;
      if (scope === 'favorites' && !book.favorito) return false;
      
      // Genre filter
      if (selectedGenre !== 'all' && book.genero !== selectedGenre) return false;
      
      // Rating filter
      if (book.notaGeral < minRating) return false;
      
      return true;
    });
  }, [books, scope, selectedYear, selectedGenre, minRating]);

  const handleExportJSON = async () => {
    if (filteredBooks.length === 0) return;
    
    setIsExportingJSON(true);
    setExportStatus(null);
    
    try {
      const exportData = {
        user: {
          name: user?.name,
          email: user?.email,
          exportDate: new Date().toISOString(),
          stats: {
            totalBooks: filteredBooks.length,
            totalPages: filteredBooks.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0),
          }
        },
        books: filteredBooks,
        userGoal: scope === 'all' || scope === 'current_year' ? userGoal : null,
        literaryProfile: scope === 'all' ? literaryProfile : null
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `littrack-backup-${new Date().getFullYear()}-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportStatus({ type: 'success', message: 'Backup JSON gerado com sucesso!' });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', message: 'Não foi possível gerar o arquivo JSON agora. Tente novamente.' });
    } finally {
      setIsExportingJSON(false);
    }
  };

  const handleExportPDF = async () => {
    if (filteredBooks.length === 0) return;
    
    setIsExportingPDF(true);
    setExportStatus(null);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(23, 23, 23); // Neutral 900
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(245, 158, 11); // Amber 500
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('LitTrack 2026', 20, 25);
      
      doc.setTextColor(163, 163, 163); // Neutral 400
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relatório de Leitura - ${user?.name || 'Usuário'}`, 20, 33);
      doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 45, 33);

      // Stats Summary
      let yPos = 55;
      doc.setTextColor(38, 38, 38); // Neutral 800
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo da Biblioteca', 20, yPos);
      
      yPos += 15;
      const totalPages = filteredBooks.reduce((acc, b) => acc + safeParseNumber(b.pageCount), 0);
      const avgRating = filteredBooks.length > 0 
        ? (filteredBooks.reduce((acc, b) => acc + b.notaGeral, 0) / filteredBooks.length).toFixed(1)
        : '0.0';

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Livros: ${filteredBooks.length}`, 25, yPos);
      doc.text(`Total de Páginas: ${new Intl.NumberFormat('pt-BR').format(totalPages)}`, 25, yPos + 7);
      doc.text(`Média de Avaliação: ${avgRating}`, 25, yPos + 14);
      
      if (userGoal && (scope === 'all' || scope === 'current_year')) {
        doc.text(`Meta Anual: ${userGoal.booksGoal} livros / ${new Intl.NumberFormat('pt-BR').format(userGoal.pagesGoal)} páginas`, 25, yPos + 21);
        yPos += 35;
      } else {
        yPos += 28;
      }

      // Books Table
      const tableData = filteredBooks.map(b => [
        b.titulo,
        b.autor,
        b.genero,
        b.status === 'lido' ? 'Lido' : b.status === 'lendo' ? 'Lendo' : 'Quero Ler',
        b.notaGeral > 0 ? b.notaGeral.toString() : '-',
        safeParseNumber(b.pageCount).toString()
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Título', 'Autor', 'Gênero', 'Status', 'Nota', 'Págs']],
        body: tableData,
        headStyles: { fillColor: [245, 158, 11], textColor: [23, 23, 23] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, cellPadding: 3 }
      });

      doc.save(`littrack-relatorio-${new Date().getFullYear()}.pdf`);
      setExportStatus({ type: 'success', message: 'Relatório PDF gerado com sucesso!' });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', message: 'Não foi possível gerar o relatório PDF agora. Tente novamente.' });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setExportStatus({ type: 'error', message: 'Arquivo inválido. Selecione um backup JSON do LitTrack.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.books || !Array.isArray(json.books)) {
          throw new Error('Formato de backup inválido');
        }
        setImportFile(json);
        setShowImportPreview(true);
        setExportStatus(null);
      } catch (error) {
        setExportStatus({ type: 'error', message: 'Arquivo inválido ou corrompido. Selecione um backup JSON do LitTrack.' });
      }
    };
    reader.readAsText(file);
    // Reset input value to allow selecting same file again
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    if (importMode === 'replace' && !showReplaceConfirm) {
      setShowReplaceConfirm(true);
      return;
    }

    setIsImporting(true);
    setExportStatus(null);
    
    try {
      const result = await importData(importFile, importMode);
      setImportResult(result);
      setShowImportPreview(false);
      setShowReplaceConfirm(false);
      setImportFile(null);
    } catch (error) {
      console.error('Import error:', error);
      setExportStatus({ type: 'error', message: 'Não foi possível importar o arquivo. O backup pode estar incompleto ou corrompido.' });
    } finally {
      setIsImporting(false);
    }
  };

  const genres: BookGenre[] = [
    'Ficção', 'Não Ficção', 'Fantasia', 'Ficção Científica', 'Romance', 
    'Suspense', 'Terror', 'Biografia', 'História', 'Autoajuda', 'Outro'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <header>
        <h1 className="text-4xl font-serif font-bold text-neutral-100 mb-2">Backup e Exportação</h1>
        <p className="text-neutral-400">Gerencie sua biblioteca com segurança, exportando relatórios ou restaurando backups.</p>
      </header>

      {exportStatus && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-2xl flex items-center gap-3 border ${
            exportStatus.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
          }`}
        >
          {exportStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{exportStatus.message}</span>
          <button 
            onClick={() => setExportStatus(null)}
            className="ml-auto text-xs uppercase tracking-wider font-bold opacity-70 hover:opacity-100"
          >
            Fechar
          </button>
        </motion.div>
      )}

      {importResult && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-4"
        >
          <div className="flex items-center gap-3 text-emerald-500">
            <CheckCircle2 size={24} />
            <h3 className="text-lg font-serif font-bold">Backup importado com sucesso!</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Livros Restaurados</p>
              <p className="text-2xl font-bold text-neutral-100">{importResult.imported}</p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Metas Restauradas</p>
              <p className="text-2xl font-bold text-neutral-100">{importResult.goals}</p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Duplicados Ignorados</p>
              <p className="text-2xl font-bold text-neutral-100">{importResult.ignored}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setImportResult(null)}
              className="px-6 py-2.5 text-neutral-400 hover:text-neutral-200 font-medium transition-colors"
            >
              Fechar
            </button>
            <button 
              onClick={() => navigate('/livros')}
              className="px-6 py-2.5 bg-amber-500 text-neutral-950 rounded-xl font-bold hover:bg-amber-600 transition-colors"
            >
              Ir para minha biblioteca
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Export Filters */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-serif font-semibold text-amber-500 flex items-center gap-2">
              <Filter size={18} />
              Filtros de Exportação
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Escopo</label>
                <select 
                  value={scope}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="all">Todos os livros</option>
                  <option value="read">Apenas livros lidos</option>
                  <option value="current_year">Apenas ano atual (2026)</option>
                  <option value="specific_year">Ano específico</option>
                  <option value="favorites">Apenas favoritos</option>
                </select>
              </div>

              {scope === 'specific_year' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Selecionar Ano</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {availableYears.length > 0 ? (
                      availableYears.map(y => <option key={y} value={y}>{y}</option>)
                    ) : (
                      <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                    )}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Gênero</label>
                <select 
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value as BookGenre | 'all')}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="all">Todos os gêneros</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Avaliação Mínima</label>
                  <span className="text-xs font-bold text-amber-500">{minRating}★</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="5" 
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Livros selecionados:</span>
                <span className="font-bold text-neutral-100">{filteredBooks.length}</span>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-serif font-semibold text-blue-500 flex items-center gap-2">
              <Upload size={18} />
              Importar Backup
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Restaure sua biblioteca a partir de um arquivo JSON exportado anteriormente.
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-neutral-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-2xl text-neutral-400 hover:text-blue-400 transition-all flex flex-col items-center gap-2 group"
            >
              <Upload size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Selecionar arquivo JSON</span>
            </button>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Export Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* JSON Export Card */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center group hover:border-amber-500/30 transition-all">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <FileJson size={40} />
              </div>
              <h3 className="text-xl font-serif font-bold text-neutral-100 mb-2">Exportar JSON</h3>
              <p className="text-sm text-neutral-400 mb-8 flex-1">
                Ideal para backup completo e portabilidade. Inclui todos os metadados, resenhas e configurações.
              </p>
              <button 
                onClick={handleExportJSON}
                disabled={isExportingJSON || filteredBooks.length === 0}
                className="w-full bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 disabled:bg-neutral-900 disabled:text-neutral-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {isExportingJSON ? (
                  <><Loader2 size={18} className="animate-spin" /> Gerando...</>
                ) : (
                  <><Download size={18} /> Baixar JSON</>
                )}
              </button>
            </div>

            {/* PDF Export Card */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center group hover:border-amber-500/30 transition-all">
              <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-serif font-bold text-neutral-100 mb-2">Relatório PDF</h3>
              <p className="text-sm text-neutral-400 mb-8 flex-1">
                Um documento elegante e legível com o resumo da sua biblioteca, estatísticas e lista de livros.
              </p>
              <button 
                onClick={handleExportPDF}
                disabled={isExportingPDF || filteredBooks.length === 0}
                className="w-full bg-neutral-800 hover:bg-blue-500 hover:text-neutral-950 disabled:bg-neutral-900 disabled:text-neutral-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {isExportingPDF ? (
                  <><Loader2 size={18} className="animate-spin" /> Gerando...</>
                ) : (
                  <><Download size={18} /> Baixar PDF</>
                )}
              </button>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6">
            <h4 className="text-amber-500 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle size={14} />
              Informações Importantes
            </h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Os arquivos gerados contêm apenas os seus dados pessoais e de leitura.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Ao importar, você pode escolher entre mesclar com seus dados atuais ou substituir sua biblioteca inteira.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>O sistema detecta duplicatas automaticamente no modo de mesclagem para evitar livros repetidos.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      <AnimatePresence>
        {showImportPreview && importFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-2xl shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => { setShowImportPreview(false); setImportFile(null); setShowReplaceConfirm(false); }}
                className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-neutral-200 transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-serif font-bold text-neutral-100 mb-6 flex items-center gap-3">
                <RefreshCw className="text-blue-500" />
                Prévia da Importação
              </h2>

              <div className="space-y-8">
                {/* Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Livros</p>
                    <p className="text-2xl font-bold text-neutral-100">{importFile.books?.length || 0}</p>
                  </div>
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Metas</p>
                    <p className="text-2xl font-bold text-neutral-100">{Array.isArray(importFile.userGoal) ? importFile.userGoal.length : (importFile.userGoal ? 1 : 0)}</p>
                  </div>
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Perfil</p>
                    <p className="text-2xl font-bold text-neutral-100">{importFile.literaryProfile ? 'Sim' : 'Não'}</p>
                  </div>
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Data Backup</p>
                    <p className="text-sm font-bold text-neutral-100 truncate">
                      {importFile.user?.exportDate ? new Date(importFile.user.exportDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Import Mode Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Escolha o modo de importação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setImportMode('merge'); setShowReplaceConfirm(false); }}
                      className={`p-5 rounded-2xl border text-left transition-all ${
                        importMode === 'merge' 
                          ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/50' 
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold ${importMode === 'merge' ? 'text-blue-400' : 'text-neutral-200'}`}>Mesclar Dados</span>
                        {importMode === 'merge' && <CheckCircle2 size={18} className="text-blue-500" />}
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Adiciona os livros do backup à sua biblioteca atual. Detecta e ignora duplicatas automaticamente.
                      </p>
                    </button>

                    <button 
                      onClick={() => setImportMode('replace')}
                      className={`p-5 rounded-2xl border text-left transition-all ${
                        importMode === 'replace' 
                          ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/50' 
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold ${importMode === 'replace' ? 'text-rose-400' : 'text-neutral-200'}`}>Substituir Tudo</span>
                        {importMode === 'replace' && <CheckCircle2 size={18} className="text-rose-500" />}
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Apaga sua biblioteca atual e a substitui completamente pelos dados do backup. Use com cautela.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Confirmations and Actions */}
                <div className="pt-6 border-t border-neutral-800 space-y-6">
                  {showReplaceConfirm && importMode === 'replace' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3"
                    >
                      <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-rose-500">Ação Irreversível</p>
                        <p className="text-xs text-rose-400/80 leading-relaxed">
                          Tem certeza que deseja substituir seus dados atuais? Todos os livros, resenhas e metas atuais serão apagados permanentemente.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => { setShowImportPreview(false); setImportFile(null); setShowReplaceConfirm(false); }}
                      className="flex-1 py-4 rounded-2xl font-bold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleImport}
                      disabled={isImporting}
                      className={`flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                        importMode === 'replace' 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
                      }`}
                    >
                      {isImporting ? (
                        <><Loader2 size={20} className="animate-spin" /> Importando...</>
                      ) : (
                        <>{importMode === 'replace' ? 'Confirmar Substituição' : 'Importar Agora'}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
