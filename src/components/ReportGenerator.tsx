import React, { useState } from 'react';
import { FileDown, X } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/format';

type DateFilter = 'day' | 'month' | 'year';

interface ReportGeneratorProps {
  transactions: Transaction[];
  categories: Category[];
  className?: string;
}

const TIMEZONE = 'America/Sao_Paulo';

// Cores do tema
const COLORS = {
  primary: '#FFD700',
  secondary: '#DAA520',
  dark: '#1E1E1E',
  gray: '#4A4A4A',
  success: '#10B981',
  danger: '#EF4444'
};

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  transactions, 
  categories,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [selectedDate, setSelectedDate] = useState(utcToZonedTime(new Date(), TIMEZONE));

  const getDateRange = (date: Date, filter: DateFilter) => {
    const zonedDate = utcToZonedTime(date, TIMEZONE);
    
    switch (filter) {
      case 'day':
        return {
          start: zonedTimeToUtc(startOfDay(zonedDate), TIMEZONE),
          end: zonedTimeToUtc(endOfDay(zonedDate), TIMEZONE)
        };
      case 'month':
        return {
          start: zonedTimeToUtc(startOfMonth(zonedDate), TIMEZONE),
          end: zonedTimeToUtc(endOfMonth(zonedDate), TIMEZONE)
        };
      case 'year':
        return {
          start: zonedTimeToUtc(startOfYear(zonedDate), TIMEZONE),
          end: zonedTimeToUtc(endOfYear(zonedDate), TIMEZONE)
        };
    }
  };

  const handleDateChange = (value: string) => {
    let newDate: Date;
    
    switch (dateFilter) {
      case 'day':
        const [year, month, day] = value.split('-').map(Number);
        newDate = new Date(year, month - 1, day, 12, 0, 0);
        break;
      
      case 'month':
        const [yearMonth, monthMonth] = value.split('-').map(Number);
        newDate = new Date(yearMonth, monthMonth - 1, 1, 12, 0, 0);
        break;
      
      case 'year':
        newDate = new Date(parseInt(value), 0, 1, 12, 0, 0);
        break;
      
      default:
        return;
    }

    const zonedDate = utcToZonedTime(newDate, TIMEZONE);
    setSelectedDate(zonedDate);
  };

  const generatePDF = async () => {
    setIsLoading(true);
    try {
      const range = getDateRange(selectedDate, dateFilter);
      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = utcToZonedTime(new Date(transaction.date), TIMEZONE);
        return transactionDate >= range.start && transactionDate <= range.end;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const doc = new jsPDF();
      
      // Configuração da fonte
      doc.setFont('helvetica', 'bold');
      
      // Logo e título
      doc.setFontSize(28);
      doc.setTextColor(COLORS.dark);
      const title = 'Januzzi Finance';
      const titleWidth = doc.getStringUnitWidth(title) * 28 / doc.internal.scaleFactor;
      const titleX = (doc.internal.pageSize.width - titleWidth) / 2;
      doc.text(title, titleX, 25);

      // Linha decorativa
      doc.setDrawColor(COLORS.primary);
      doc.setLineWidth(0.5);
      doc.line(20, 30, doc.internal.pageSize.width - 20, 30);

      // Período
      doc.setFontSize(12);
      doc.setTextColor(COLORS.gray);
      const periodText = `Período: ${format(range.start, dateFilter === 'day' ? "dd 'de' MMMM 'de' yyyy" : dateFilter === 'month' ? "MMMM 'de' yyyy" : 'yyyy', { locale: ptBR })}`;
      const periodWidth = doc.getStringUnitWidth(periodText) * 12 / doc.internal.scaleFactor;
      const periodX = (doc.internal.pageSize.width - periodWidth) / 2;
      doc.text(periodText, periodX, 40);

      // Cálculo dos totais
      const totalIncome = filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
      const totalExpense = filteredTransactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
      const balance = totalIncome - totalExpense;

      // Cards de resumo
      const drawCard = (title: string, value: string, x: number, y: number, width: number, height: number, color: string) => {
        // Fundo do card
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(color);
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, width, height, 3, 3, 'FD');

        // Título do card
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.gray);
        doc.text(title, x + 5, y + 10);

        // Valor
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const valueWidth = doc.getStringUnitWidth(value) * 12 / doc.internal.scaleFactor;
        const valueX = Math.min(x + 5, x + width - 5 - valueWidth);
        doc.setTextColor(color);
        doc.text(value, valueX, y + 25);
      };

      // Desenha os cards
      const cardWidth = 58;
      const cardHeight = 35;
      const spacing = 6;
      const totalWidth = cardWidth * 3 + spacing * 2;
      const startX = (doc.internal.pageSize.width - totalWidth) / 2;
      
      drawCard('Receitas', formatCurrency(totalIncome), startX, 50, cardWidth, cardHeight, COLORS.success);
      drawCard('Despesas', formatCurrency(totalExpense), startX + cardWidth + spacing, 50, cardWidth, cardHeight, COLORS.danger);
      drawCard('Saldo', formatCurrency(balance), startX + (cardWidth + spacing) * 2, 50, cardWidth, cardHeight, COLORS.primary);

      // Resumo por categoria
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(COLORS.dark);
      doc.text('Resumo por Categoria', 14, 100);

      const categoryTotals = filteredTransactions.reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
          acc[t.category].income += t.amount;
        } else {
          acc[t.category].expense += t.amount;
        }
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      // Tabela de categorias
      const categoryData = Object.entries(categoryTotals).map(([category, totals]) => [
        category,
        totals.income > 0 ? formatCurrency(totals.income) : '-',
        totals.expense > 0 ? formatCurrency(totals.expense) : '-',
        formatCurrency(totals.income - totals.expense)
      ]);

      autoTable(doc, {
        startY: 110,
        head: [['Categoria', 'Receitas', 'Despesas', 'Saldo']],
        body: categoryData,
        headStyles: {
          fillColor: COLORS.dark,
          textColor: COLORS.primary,
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: '#f8f8f8'
        },
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 70, halign: 'left' },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 14, right: 14 },
        styles: {
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
          valign: 'middle',
          overflow: 'linebreak',
          lineWidth: 0.1
        }
      });

      // Tabela de transações
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(COLORS.dark);
      doc.text('Detalhamento de Transações', 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
        body: filteredTransactions.map(t => [
          format(utcToZonedTime(new Date(t.date), TIMEZONE), 'dd/MM/yyyy'),
          t.description,
          t.category,
          t.type === 'income' ? 'Receita' : 'Despesa',
          formatCurrency(t.amount)
        ]),
        headStyles: {
          fillColor: COLORS.dark,
          textColor: COLORS.primary,
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: '#f8f8f8'
        },
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 35, halign: 'left' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 14, right: 14 },
        styles: {
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
          valign: 'middle',
          overflow: 'linebreak',
          lineWidth: 0.1
        }
      });

      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.gray);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      doc.save(`relatorio-${format(range.start, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const getDateInput = () => {
    switch (dateFilter) {
      case 'day':
        return (
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
          />
        );
      case 'month':
        return (
          <input
            type="month"
            value={format(selectedDate, 'yyyy-MM')}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
          />
        );
      case 'year':
        return (
          <input
            type="number"
            value={format(selectedDate, 'yyyy')}
            onChange={(e) => handleDateChange(e.target.value)}
            min="1900"
            max="2100"
            className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
          />
        );
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <FileDown size={20} />
        <span>Relatórios</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-secondary rounded-xl p-4 sm:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gold-primary">Gerar Relatório</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gold-primary p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Período
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                >
                  <option value="day">Dia</option>
                  <option value="month">Mês</option>
                  <option value="year">Ano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selecione o Período
                </label>
                {getDateInput()}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gold-primary"
                >
                  Cancelar
                </button>
                <button
                  onClick={generatePDF}
                  disabled={isLoading}
                  className="bg-gold-primary text-dark-primary px-4 py-2 rounded-lg hover:bg-gold-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={20} />
                      <span>Gerar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};