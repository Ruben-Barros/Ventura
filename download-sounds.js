const fs = require('fs');
const path = require('path');
const https = require('https');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Ensure the sound directory exists
const soundDir = path.join(__dirname, 'assets', 'sounds');
if (!fs.existsSync(soundDir)) {
  fs.mkdirSync(soundDir, { recursive: true });
}

// List of sounds we need with their URLs
// Using free sounds from Freesound.org and Zapsplat
const sounds = [
  {
    name: 'intro-chime.mp3',
    url: 'https://freesound.org/data/previews/648/648452_6142149-lq.mp3',
    attribution: 'Intro Chime by Freesound user Groundworking'
  },
  {
    name: 'choice-bell.mp3',
    url: 'https://freesound.org/data/previews/495/495536_7541321-lq.mp3',
    attribution: 'Bell by Freesound user TheEasterEgg'
  },
  {
    name: 'choice-select.mp3',
    url: 'https://freesound.org/data/previews/563/563792_4935099-lq.mp3',
    attribution: 'UI Click by Freesound user MATRIXXX_'
  },
  {
    name: 'forest-ambiance.mp3',
    url: 'https://freesound.org/data/previews/585/585161_11861866-lq.mp3',
    attribution: 'Forest Ambiance by Freesound user klankbeeld'
  },
  {
    name: 'cave-ambiance.mp3',
    url: 'https://freesound.org/data/previews/523/523724_7344156-lq.mp3',
    attribution: 'Cave Drips by Freesound user newagesoup'
  },
  {
    name: 'village-ambiance.mp3',
    url: 'https://freesound.org/data/previews/617/617359_11621291-lq.mp3',
    attribution: 'Village Ambiance by Freesound user felix.blume'
  },
  {
    name: 'footsteps.mp3',
    url: 'https://freesound.org/data/previews/191/191519_2933937-lq.mp3',
    attribution: 'Footsteps by Freesound user alienistcog'
  },
  {
    name: 'door-open.mp3',
    url: 'https://freesound.org/data/previews/574/574639_901676-lq.mp3',
    attribution: 'Door Open by Freesound user aglinder'
  },
  {
    name: 'magic-spell.mp3',
    url: 'https://freesound.org/data/previews/437/437412_5847890-lq.mp3',
    attribution: 'Magic Spell by Freesound user BurghRecords'
  }
];

// Download a file from URL
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Main function to download all files
async function downloadAllSounds() {
  console.log('Starting sound file downloads...');
  
  // Create attribution file
  const attributionPath = path.join(soundDir, 'ATTRIBUTION.txt');
  let attributionContent = 'Sound File Attributions:\n\n';
  
  for (const sound of sounds) {
    attributionContent += `${sound.name}: ${sound.attribution}\n`;
  }
  
  fs.writeFileSync(attributionPath, attributionContent);
  console.log('Created attribution file.');
  
  // Download each sound file
  for (const sound of sounds) {
    const filePath = path.join(soundDir, sound.name);
    
    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      console.log(`File ${sound.name} already exists. Skipping.`);
      continue;
    }
    
    console.log(`Downloading ${sound.name}...`);
    try {
      await downloadFile(sound.url, filePath);
    } catch (err) {
      console.error(`Error downloading ${sound.name}:`, err);
    }
  }
  
  console.log('All sound files downloaded successfully!');
}

// Run the download
downloadAllSounds().catch(console.error); 