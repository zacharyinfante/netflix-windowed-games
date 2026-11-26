const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

function render(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled ? 'On' : 'Off';
  status.classList.toggle('off', !enabled);
}

chrome.storage.local.get({ enabled: true }).then(({ enabled }) => render(enabled));

toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  await chrome.storage.local.set({ enabled });
  render(enabled);
});
