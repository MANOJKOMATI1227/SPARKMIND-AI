import { jsPDF } from 'jspdf';
import { Conversation } from '../types/index.js';

interface ExportPDFOptions {
  userName?: string;
  userEmail?: string;
}

/**
 * Clean markdown symbols and replace unsupported Unicode emojis for clean plaintext rendering in jsPDF
 */
function cleanMarkdownForPDF(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '') // Remove heading hashes
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold asterisks
    .replace(/\*(.*?)\*/g, '$1') // Remove italic asterisks
    .replace(/__([^_]+)__/g, '$1') // Remove double underscores
    .replace(/_([^_]+)_/g, '$1') // Remove single underscores
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // Format links as Label (URL)
    .replace(/^>\s+/gm, '   ') // Indent blockquotes
    .replace(/`([^`]+)`/g, '$1') // Inline code backticks
    .replace(/🧠/g, '[Deep Reasoning]')
    .replace(/⚡/g, '[Flash]')
    .replace(/⚖️/g, '[Medium]')
    .replace(/✨/g, '*')
    .replace(/👤/g, '')
    .replace(/💡/g, '[Tip]')
    .replace(/⚠️/g, '[Notice]')
    // Strip other surrogate pairs/emojis that corrupt standard PDF fonts
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF]/g, '');
}

/**
 * Exports a full conversation to a beautifully formatted PDF document.
 */
export async function exportConversationToPDF(
  conversation: Conversation,
  options?: ExportPDFOptions
): Promise<{ success: boolean; fileName: string }> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (cursorY + neededHeight > pageHeight - 20) {
        doc.addPage();
        cursorY = margin;
        return true;
      }
      return false;
    };

    // ==========================================
    // 1. Header Banner & Branding
    // ==========================================
    // Gradient / Filled header band
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, cursorY, contentWidth, 26, 'F');

    // Amber accent bar on top
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(margin, cursorY, contentWidth, 2, 'F');

    // Brand Name: SPARKMIND AI
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('SPARKMIND AI', margin + 6, cursorY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Next-Gen AI Workspace • Conversation Transcript', margin + 6, cursorY + 18);

    // Exported timestamp on right side of header
    const exportDateStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Exported: ${exportDateStr}`, pageWidth - margin - 6, cursorY + 11, { align: 'right' });

    if (conversation.workspace) {
      doc.text(`Workspace: ${conversation.workspace.toUpperCase()}`, pageWidth - margin - 6, cursorY + 18, {
        align: 'right',
      });
    }

    cursorY += 32;

    // ==========================================
    // 2. Conversation Metadata Summary Box
    // ==========================================
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, cursorY, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59); // slate-800
    const titleText = doc.splitTextToSize(`Title: ${conversation.title || 'Conversation'}`, contentWidth - 12);
    doc.text(titleText[0] || 'Conversation', margin + 6, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    const authorStr = options?.userName ? `User: ${options.userName}  •  ` : '';
    const msgCountStr = `Total Messages: ${conversation.messages.length}`;
    const dateStr = `Created: ${new Date(conversation.createdAt || Date.now()).toLocaleString()}`;
    doc.text(`${authorStr}${dateStr}  •  ${msgCountStr}`, margin + 6, cursorY + 11.5);

    cursorY += 22;

    // ==========================================
    // 3. Conversation Messages
    // ==========================================
    for (let i = 0; i < conversation.messages.length; i++) {
      const msg = conversation.messages[i];
      const isUser = msg.role === 'user';
      const roleTitle = isUser ? 'USER PROMPT' : 'SPARKMIND AI';
      const timeStr = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
      const modeStr = msg.reasoningMode
        ? ` • [${msg.reasoningMode.toUpperCase()} MODE]`
        : !isUser
        ? ' • [FLASH MODE]'
        : '';

      // Check for code blocks in message
      const parts: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(msg.content)) !== null) {
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: msg.content.substring(lastIndex, match.index),
          });
        }
        parts.push({
          type: 'code',
          lang: match[1] || 'code',
          content: match[2].trim(),
        });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < msg.content.length) {
        parts.push({
          type: 'text',
          content: msg.content.substring(lastIndex),
        });
      }

      // Check page break before message header
      checkPageBreak(25);

      // Card Header
      if (isUser) {
        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(203, 213, 225); // slate-300
      } else {
        doc.setFillColor(254, 252, 232); // amber-50 (or soft light yellow)
        doc.setDrawColor(251, 191, 36); // amber-400
      }

      // Left role accent pill
      doc.setFillColor(isUser ? 59 : 245, isUser ? 130 : 158, isUser ? 246 : 11);
      doc.rect(margin, cursorY, 2.5, 7, 'F');

      // Role Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isUser ? 30 : 180, isUser ? 41 : 83, isUser ? 59 : 9);
      doc.text(`${roleTitle}${modeStr}`, margin + 6, cursorY + 5);

      if (timeStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(timeStr, pageWidth - margin - 4, cursorY + 5, { align: 'right' });
      }

      cursorY += 9;

      // Render parts
      for (const part of parts) {
        if (part.type === 'code') {
          // Render Code Block
          checkPageBreak(20);
          const codeLines = doc.splitTextToSize(part.content, contentWidth - 14);
          const blockHeight = codeLines.length * 4 + 7;

          // Box background
          doc.setFillColor(241, 245, 249); // slate-100
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.roundedRect(margin + 2, cursorY, contentWidth - 4, blockHeight, 1.5, 1.5, 'FD');

          // Lang tag
          doc.setFont('courier', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`[${part.lang?.toUpperCase() || 'CODE'}]`, margin + 6, cursorY + 4);

          // Code text
          doc.setFont('courier', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);

          let lineY = cursorY + 8;
          for (let l = 0; l < codeLines.length; l++) {
            if (lineY > pageHeight - 20) {
              doc.addPage();
              lineY = margin + 5;
            }
            doc.text(codeLines[l], margin + 6, lineY);
            lineY += 4;
          }

          cursorY += blockHeight + 3;
        } else {
          // Render Clean Text
          const cleanText = cleanMarkdownForPDF(part.content).trim();
          if (!cleanText) continue;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59); // slate-800

          const textLines = doc.splitTextToSize(cleanText, contentWidth - 8);
          for (let l = 0; l < textLines.length; l++) {
            checkPageBreak(5);
            doc.text(textLines[l], margin + 4, cursorY);
            cursorY += 4.5;
          }
          cursorY += 2;
        }
      }

      // If message had sources, render citations
      if (msg.sources && msg.sources.length > 0) {
        checkPageBreak(8);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(16, 185, 129); // emerald-500
        const sourceTitles = msg.sources.map((s) => s.title).join(' • ');
        const wrappedSources = doc.splitTextToSize(`Sources: ${sourceTitles}`, contentWidth - 8);
        for (const sLine of wrappedSources) {
          doc.text(sLine, margin + 4, cursorY);
          cursorY += 3.8;
        }
      }

      // Message Separator line
      cursorY += 4;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 5;
    }

    // ==========================================
    // 4. Page Footers (Page X of Y)
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      // Left footer text
      doc.text('SparkMind AI Workspace • Chat. Code. Learn. Create.', margin, pageHeight - 7);

      // Right footer page count
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    // Generate sanitized file name
    const sanitizedTitle = (conversation.title || 'SparkMind_Chat')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 40);
    const fileName = `${sanitizedTitle || 'SparkMind_Conversation'}.pdf`;

    // Trigger browser download
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
