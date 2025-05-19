import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category, Company } from '../types';
import { formatCurrency } from '../utils/format';
import { FileDown } from 'lucide-react';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: {
      previous: {
        finalY: number;
      };
    };
  }
}

interface ReportGeneratorProps {
  transactions: Transaction[];
  categories: Category[];
  companies?: Company[];
  className?: string;
  filter: 'month' | 'year';
  period: string; // yyyy-MM para mês, yyyy para ano
  onClose?: () => void;
  disabled?: boolean;
}

const TIMEZONE = 'America/Sao_Paulo';

const COLORS = {
  primary: '#FFD700',
  secondary: '#DAA520',
  dark: '#1E1E1E',
  gray: '#4A4A4A',
  success: '#10B981',
  danger: '#EF4444',
  info: '#3B82F6',
  background: '#121212'
};

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  transactions, 
  categories,
  companies = [],
  className = '',
  filter,
  period,
  onClose,
  disabled
}) => {
  const getDateRange = () => {
    if (filter === 'month' && period) {
      const [year, month] = period.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return {
        start: zonedTimeToUtc(startOfMonth(date), TIMEZONE),
        end: zonedTimeToUtc(endOfMonth(date), TIMEZONE)
      };
    }
    if (filter === 'year' && period) {
      const year = Number(period);
      const date = new Date(year, 0, 1);
      return {
        start: zonedTimeToUtc(startOfYear(date), TIMEZONE),
        end: zonedTimeToUtc(endOfYear(date), TIMEZONE)
      };
    }
    // fallback: mês atual
    const now = new Date();
    return {
      start: zonedTimeToUtc(startOfMonth(now), TIMEZONE),
      end: zonedTimeToUtc(endOfMonth(now), TIMEZONE)
    };
  };

  const generatePDF = async () => {
    try {
      const range = getDateRange();
      const filteredTransactions = transactions
        .filter(transaction => {
          const transactionDate = utcToZonedTime(new Date(transaction.date), TIMEZONE);
          return transactionDate >= range.start && transactionDate <= range.end;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalIncome = filteredTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
      const totalExpense = filteredTransactions.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
      const totalInvestment = filteredTransactions.reduce((sum, t) => t.type === 'investment' ? sum + t.amount : sum, 0);
      const balance = totalIncome - totalExpense - totalInvestment;

      const doc = new jsPDF();

      // Title Page
      doc.setFillColor(COLORS.background);
      doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(COLORS.primary);
      const title = 'Relatório Financeiro';
      const titleWidth = doc.getStringUnitWidth(title) * 32 / doc.internal.scaleFactor;
      const titleX = (doc.internal.pageSize.width - titleWidth) / 2;
      doc.text(title, titleX, 80);

      // Period
      doc.setFontSize(16);
      doc.setTextColor(COLORS.gray);
      const periodText = `Período: ${format(range.start, "MMMM 'de' yyyy", { locale: ptBR })}`;
      const periodWidth = doc.getStringUnitWidth(periodText) * 16 / doc.internal.scaleFactor;
      const periodX = (doc.internal.pageSize.width - periodWidth) / 2;
      doc.text(periodText, periodX, 100);

      // Generation date
      doc.setFontSize(12);
      const dateText = `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
      const dateWidth = doc.getStringUnitWidth(dateText) * 12 / doc.internal.scaleFactor;
      const dateX = (doc.internal.pageSize.width - dateWidth) / 2;
      doc.text(dateText, dateX, 120);

      // Overall Summary Page
      doc.addPage();
      doc.setFillColor(COLORS.background);
      doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(COLORS.primary);
      doc.text('Resumo Geral', 20, 30);

      const drawCard = (x: number, y: number, width: number, height: number, borderColor: string, textColor: string) => {
        doc.setFillColor('#000000'); // Fundo preto
        doc.setDrawColor(borderColor);
        doc.roundedRect(x, y, width, height, 5, 5, 'FD');
        doc.setTextColor(textColor);
      };

      const adjustSpacing = (currentY: number, additionalSpacing: number) => {
        return currentY + additionalSpacing;
      };

      // Resumo Geral como cards
      const cardWidth = 80;
      const cardHeight = 50;
      const cardSpacing = 10;
      const cardStartX = 20;
      let cardStartY = 50;

      const summaryCards = [
        { label: 'Receitas Totais', value: formatCurrency(totalIncome), borderColor: '#28A745', textColor: '#28A745' },
        { label: 'Despesas Totais', value: formatCurrency(totalExpense), borderColor: '#DC3545', textColor: '#DC3545' },
        { label: 'Investimentos Totais', value: formatCurrency(totalInvestment), borderColor: '#007BFF', textColor: '#007BFF' },
        { label: 'Saldo Final', value: formatCurrency(balance), borderColor: '#FFC107', textColor: '#FFC107' }
      ];

      summaryCards.forEach((card, index) => {
        const x = cardStartX + (index % 2) * (cardWidth + cardSpacing);
        const y = cardStartY + Math.floor(index / 2) * (cardHeight + cardSpacing);

        drawCard(x, y, cardWidth, cardHeight, card.borderColor, card.textColor);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(card.label, x + 5, y + 15);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(card.value, x + 5, y + 30);
      });

      cardStartY = adjustSpacing(cardStartY, Math.ceil(summaryCards.length / 2) * (cardHeight + cardSpacing) + 20);

      // Ajusta a seção de análise por categoria para começar após os cards
      autoTable(doc, {
        startY: cardStartY,
        head: [['Categoria', 'Receitas', 'Despesas', 'Investimentos', 'Saldo']],
        body: categories.map(category => {
          const categoryTransactions = filteredTransactions.filter(t => t.category === category.name);
          const income = categoryTransactions.reduce((sum, t) => 
            t.type === 'income' ? sum + t.amount : sum, 0);
          const expense = categoryTransactions.reduce((sum, t) => 
            t.type === 'expense' ? sum + t.amount : sum, 0);
          const investment = categoryTransactions.reduce((sum, t) => 
            t.type === 'investment' ? sum + t.amount : sum, 0);
          
          return [
            category.name,
            formatCurrency(income),
            formatCurrency(expense),
            formatCurrency(investment),
            formatCurrency(income - expense - investment)
          ];
        }),
        headStyles: {
          fillColor: COLORS.dark,
          textColor: COLORS.primary,
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: '#f8f8f8'
        },
        margin: { left: 15, right: 15 }
      });

      // Adiciona o título 'EMPRESAS' antes dos dados das empresas
      if (companies.length > 0) {
        doc.addPage();
        doc.setFillColor(COLORS.background);
        doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(COLORS.primary);
        doc.text('EMPRESAS', 20, 30);

        companies.forEach((company) => {
          const companyTransactions = filteredTransactions.filter(t => t.companyId === company.id);
          if (companyTransactions.length === 0) return;

          let startY = doc.autoTable.previous?.finalY ? doc.autoTable.previous.finalY + 20 : 50;

          // Verifica se há espaço suficiente na página atual, caso contrário, adiciona uma nova página
          if (startY + 60 > doc.internal.pageSize.height) {
            doc.addPage();
            startY = 50;
          }

          // Cabeçalho da empresa
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.setTextColor(COLORS.primary);
          doc.text(`Empresa: ${company.name}`, 20, startY);

          doc.setFontSize(12);
          doc.setTextColor(COLORS.gray);
          doc.text(`CNPJ: ${company.cnpj.replace(/^\d{2}(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}`, 20, startY + 10);

          // Resumo da empresa como cards
          const companyCardWidth = 80;
          const companyCardHeight = 50;
          const companyCardSpacing = 10;
          const companyCardStartX = 20;
          let companyCardStartY = startY + 20;

          const companySummaryCards = [
            { label: 'Receitas', value: formatCurrency(totalIncome), borderColor: '#28A745', textColor: '#28A745' },
            { label: 'Despesas', value: formatCurrency(totalExpense), borderColor: '#DC3545', textColor: '#DC3545' },
            { label: 'Investimentos', value: formatCurrency(totalInvestment), borderColor: '#007BFF', textColor: '#007BFF' },
            { label: 'Saldo', value: formatCurrency(balance), borderColor: '#FFC107', textColor: '#FFC107' }
          ];

          companySummaryCards.forEach((card) => {
            const x = companyCardStartX + (companySummaryCards.indexOf(card) % 2) * (companyCardWidth + companyCardSpacing);
            const y = companyCardStartY + Math.floor(companySummaryCards.indexOf(card) / 2) * (companyCardHeight + companyCardSpacing);

            // Verifica se há espaço suficiente para os cards, caso contrário, adiciona uma nova página
            if (y + companyCardHeight > doc.internal.pageSize.height) {
              doc.addPage();
              companyCardStartY = 50;
            }

            drawCard(x, y, companyCardWidth, companyCardHeight, card.borderColor, card.textColor);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(card.label, x + 5, y + 15);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(card.value, x + 5, y + 30);
          });

          companyCardStartY = adjustSpacing(companyCardStartY, Math.ceil(companySummaryCards.length / 2) * (companyCardHeight + companyCardSpacing) + 20);

          // Tabela de transações da empresa
          const transactionData = companyTransactions.map(t => [
            format(utcToZonedTime(new Date(t.date), TIMEZONE), 'dd/MM/yyyy'),
            t.description,
            t.category,
            t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Investimento',
            formatCurrency(t.amount)
          ]);

          autoTable(doc, {
            startY: companyCardStartY,
            head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
            body: transactionData,
            headStyles: {
              fillColor: COLORS.dark,
              textColor: COLORS.primary,
              fontStyle: 'bold',
              fontSize: 10,
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 8,
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: '#f8f8f8'
            },
            margin: { left: 15, right: 15 }
          });
        });
      }

      // Footer with page numbers
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

      // Save the PDF
      const fileName = `relatorio-${format(range.start, 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      if (onClose) onClose();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  return (
    <button
      onClick={generatePDF}
      className={className}
      disabled={disabled}
      style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
    >
      <FileDown size={32} className="text-gold-primary" />
      <span>Gerar PDF</span>
    </button>
  );
};