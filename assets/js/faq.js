document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      
      if (question) {
          question.addEventListener('click', () => {
              const answer = item.querySelector('.faq-answer');
              const isOpen = item.classList.contains('active');

              // Opcional: Cierra todos los demás items
              faqItems.forEach(otherItem => {
                  if (otherItem !== item) {
                      otherItem.classList.remove('active');
                      otherItem.querySelector('.faq-answer').style.maxHeight = null;
                  }
              });

              // Abre o cierra el item clickeado
              if (isOpen) {
                  item.classList.remove('active');
                  answer.style.maxHeight = null;
              } else {
                  item.classList.add('active');
                  // Se ajusta a la altura del contenido para una animación suave
                  answer.style.maxHeight = answer.scrollHeight + "px";
              }
          });
      }
  });
});