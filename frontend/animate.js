const animateSlide = () => {
    const labels = document.getElementsByClassName('slide-in');
  
    for (let i = 0; i < labels.length; i++) {
      labels.item(i).style.transition = `transform 800ms ${
        (i * 200) / (i + 3)
      }ms cubic-bezier(0.15, 0.5, ${0.2 + i * i * 0.004}, ${
        1.15 + i * i * 0.0005
      }), opacity 600ms ${i * 30}ms cubic-bezier(0.1, 0.8, 0.3, 1)`;
    }
  
    setTimeout(
      () => document.getElementById('list-wrapper').classList.add('active'),
      600
    );
  };
  
  const revealForm = () => {
    const el = document.getElementById("reveal-forms-wrapper");
  
    setTimeout(() => { el.classList.add('active'); }, 300 )
  }