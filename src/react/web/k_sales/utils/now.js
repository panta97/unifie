function now() {
  const currTime = new Date();
  const hours = String(currTime.getHours()).padStart(2, '0');
  const minutes = String(currTime.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default now;
