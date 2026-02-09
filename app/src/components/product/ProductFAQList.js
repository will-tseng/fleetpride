import { 
  Box,
  Typography
} from '@mui/material';

export default function ProductFAQList({ 
  faqData
}) {
  // Parse FAQ data from the _lw_ai_faq_enrichment_t field
  let faqs = [];
  
  try {
    if (typeof faqData === 'string') {
      // Try to extract JSON from the string using regex
      const jsonMatch = faqData.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        faqs = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Fallback: try parsing the entire string
        const parsed = JSON.parse(faqData);
        faqs = Array.isArray(parsed) ? parsed : [parsed];
      }
    } else if (Array.isArray(faqData)) {
      faqs = faqData;
    } else if (faqData && typeof faqData === 'object') {
      // If it's an object, try to extract FAQ array or treat as single FAQ
      faqs = faqData.faqs || faqData.questions || [faqData];
    }
  } catch (error) {
    return null;
  }

  // Ensure we have valid FAQ data with question/answer pairs
  if (!Array.isArray(faqs) || faqs.length === 0) {
    return null;
  }

  // Filter out invalid FAQ items and clean up answers
  const validFaqs = faqs.filter(faq => 
    faq && 
    typeof faq === 'object' && 
    (faq.question || faq.q) && 
    (faq.answer || faq.a) &&
    // Exclude FAQs that mention warranty
    !((faq.question || faq.q).toLowerCase().includes('warranty')) &&
    !((faq.answer || faq.a).toLowerCase().includes('warranty'))
  ).map(faq => ({
    question: faq.question || faq.q,
    answer: (faq.answer || faq.a)
      .replace(/\.\.\. Read more\.$/, '') // Remove "... Read more." suffix
      .trim()
  }));

  if (validFaqs.length === 0) {
    return null;
  }

  // Limit to first 6 FAQs for space optimization
  const displayFaqs = validFaqs.slice(0, 6);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {displayFaqs.map((faq, index) => (
        <Box key={index}>
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: '0.85rem',
              color: 'primary.main'
            }}
          >
            Q: {faq.question}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              fontSize: '0.8rem',
              color: 'text.secondary'
            }}
          >
            A: {faq.answer}
          </Typography>
        </Box>
      ))}
      
      {validFaqs.length > 6 && (
        <Typography
          variant='caption'
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            fontStyle: 'italic',
            mt: 1
          }}
        >
          +{validFaqs.length - 6} more questions available via chat
        </Typography>
      )}
    </Box>
  );
}