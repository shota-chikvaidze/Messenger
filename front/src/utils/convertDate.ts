  const convertDate = (date: string) => {
    if(!date) return

    return new Date(date).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit'
    })
  }


export default convertDate