import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

/* ═══ Constants ═══ */
const GLOBE_RADIUS = 5;
const MARKER_BASE_SIZE = 0.06;
const ATMOSPHERE_COLOR = new THREE.Color(0x1a6b5a);
const ROTATION_SPEED = 0.0008;
const CLICK_THRESHOLD = 8; // pixels — ignore click if mouse moved more than this

/* ═══ Geo type colors (same palette as flat map) ═══ */
const GEO_COLORS_HEX = {
  city: 0xd4a84b, village: 0x66bb6a, mountain: 0xa1887f, river: 0x4fc3f7,
  fortress: 0xef5350, region: 0xce93d8, town: 0xff8a65, district: 0xffb74d,
  valley: 0x81c784, water: 0x29b6f6, well: 0x4dd0e1, monastery: 0x9575cd,
  spring: 0x26c6da, pass: 0x8d6e63, island: 0x4db6ac, desert: 0xffd54f,
  place: 0x90a4ae, market: 0xf06292, quarter: 0x78909c, wadi: 0xaed581,
  sea: 0x1565c0,
};

/* ═══ Lat/Lon → 3D position on sphere ═══ */
function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* ═══ Atmosphere shader ═══ */
const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragmentShader = `
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    gl_FragColor = vec4(uColor, intensity * 0.6);
  }
`;

/* ═══ Earth texture URL (dark style) ═══ */
const EARTH_TEXTURE_URL = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg';
const EARTH_BUMP_URL = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png';

export default function YaqutGlobe({ lang, ty, data, selectedId, selectedEntry, onSelect }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const globeRef = useRef(null);
  const markersGroupRef = useRef(null);
  const selectedRingRef = useRef(null);
  const animFrameRef = useRef(null);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.3, y: 0 });
  const autoRotate = useRef(true);
  const zoomRef = useRef(12);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const [hoveredEntry, setHoveredEntry] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  /* ═══ Initialize scene ═══ */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c18);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = zoomRef.current;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Globe group (for rotation)
    const globeGroup = new THREE.Group();
    globeRef.current = globeGroup;
    scene.add(globeGroup);

    // Earth sphere
    const loader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

    // Load texture with fallback
    loader.load(
      EARTH_TEXTURE_URL,
      (texture) => {
        const earthMat = new THREE.MeshPhongMaterial({
          map: texture,
          bumpScale: 0.05,
          specular: new THREE.Color(0x111111),
          shininess: 5,
        });
        const earthMesh = new THREE.Mesh(earthGeo, earthMat);
        globeGroup.add(earthMesh);
      },
      undefined,
      () => {
        // Fallback: dark solid globe
        const earthMat = new THREE.MeshPhongMaterial({
          color: 0x0a1628,
          specular: new THREE.Color(0x111111),
          shininess: 5,
        });
        const earthMesh = new THREE.Mesh(earthGeo, earthMat);
        globeGroup.add(earthMesh);
      }
    );

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: { uColor: { value: ATMOSPHERE_COLOR } },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // Markers group
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // Initial rotation → center Islamic world (~30°N, 45°E)
    globeGroup.rotation.x = 0.3;
    globeGroup.rotation.y = -0.8;

    // Animate
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);

      if (autoRotate.current && !isDragging.current) {
        globeGroup.rotation.y += ROTATION_SPEED;
      }

      camera.position.z = zoomRef.current;
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const handleResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  /* ═══ Mouse interaction: drag rotation + zoom ═══ */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseDown = (e) => {
      isDragging.current = true;
      autoRotate.current = false;
      prevMouse.current = { x: e.clientX, y: e.clientY };
      // Store click start position to distinguish click from drag
      containerRef.current._clickStart = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging.current || !globeRef.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      globeRef.current.rotation.y += dx * 0.005;
      globeRef.current.rotation.x += dy * 0.005;
      globeRef.current.rotation.x = Math.max(-1.5, Math.min(1.5, globeRef.current.rotation.x));
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e) => {
      const start = containerRef.current?._clickStart;
      const wasDrag = start && (Math.abs(e.clientX - start.x) > CLICK_THRESHOLD || Math.abs(e.clientY - start.y) > CLICK_THRESHOLD);
      isDragging.current = false;

      // Only fire click if mouse didn't move (not a drag)
      if (!wasDrag && containerRef.current && cameraRef.current && markersGroupRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        // Use larger threshold for small markers
        raycaster.current.params.Points = { threshold: 0.1 };

        const intersects = raycaster.current.intersectObjects(markersGroupRef.current.children, true);
        if (intersects.length > 0) {
          const id = intersects[0].object.userData?.entryId;
          if (id && onSelect) onSelect(id);
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      zoomRef.current = Math.max(7, Math.min(25, zoomRef.current + e.deltaY * 0.005));
    };

    // Touch support
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        autoRotate.current = false;
        prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        containerRef.current._clickStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e) => {
      if (!isDragging.current || !globeRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouse.current.x;
      const dy = e.touches[0].clientY - prevMouse.current.y;
      globeRef.current.rotation.y += dx * 0.005;
      globeRef.current.rotation.x += dy * 0.005;
      globeRef.current.rotation.x = Math.max(-1.5, Math.min(1.5, globeRef.current.rotation.x));
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e) => {
      const start = containerRef.current?._clickStart;
      const touch = e.changedTouches?.[0];
      const wasDrag = start && touch && (Math.abs(touch.clientX - start.x) > CLICK_THRESHOLD || Math.abs(touch.clientY - start.y) > CLICK_THRESHOLD);
      isDragging.current = false;
      if (!wasDrag && touch && containerRef.current && cameraRef.current && markersGroupRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouse.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        const intersects = raycaster.current.intersectObjects(markersGroupRef.current.children, true);
        if (intersects.length > 0) {
          const id = intersects[0].object.userData?.entryId;
          if (id && onSelect) onSelect(id);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [onSelect]);

  /* ═══ Update markers when data changes ═══ */
  useEffect(() => {
    const group = markersGroupRef.current;
    if (!group) return;

    // Clear old markers
    while (group.children.length > 0) {
      const child = group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      group.remove(child);
    }

    // Shared geometry for performance
    const markerGeo = new THREE.SphereGeometry(MARKER_BASE_SIZE, 6, 6);

    // Material cache by geo type
    const matCache = {};

    data.forEach(e => {
      if (e.lat == null || e.lon == null) return;
      const pos = latLonToVec3(e.lat, e.lon, GLOBE_RADIUS * 1.005);

      const colorHex = GEO_COLORS_HEX[e.gt] || 0x90a4ae;
      if (!matCache[e.gt]) {
        matCache[e.gt] = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.85,
        });
      }

      const marker = new THREE.Mesh(markerGeo, matCache[e.gt]);
      marker.position.copy(pos);
      marker.userData = { entryId: e.id };
      group.add(marker);
    });

    return () => {
      markerGeo.dispose();
      Object.values(matCache).forEach(m => m.dispose());
    };
  }, [data]);

  /* ═══ Highlight selected entry ═══ */
  useEffect(() => {
    const group = markersGroupRef.current;
    if (!group) return;

    // Remove old ring
    if (selectedRingRef.current) {
      if (selectedRingRef.current.geometry) selectedRingRef.current.geometry.dispose();
      if (selectedRingRef.current.material) selectedRingRef.current.material.dispose();
      group.remove(selectedRingRef.current);
      selectedRingRef.current = null;
    }

    if (!selectedEntry || selectedEntry.lat == null) return;

    const pos = latLonToVec3(selectedEntry.lat, selectedEntry.lon, GLOBE_RADIUS * 1.01);
    const ringGeo = new THREE.SphereGeometry(MARKER_BASE_SIZE * 3, 12, 12);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x1a6b5a,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    group.add(ring);
    selectedRingRef.current = ring;

    // Rotate globe to show selected entry
    if (globeRef.current) {
      const targetY = -(selectedEntry.lon + 180) * (Math.PI / 180) + Math.PI;
      const targetX = (selectedEntry.lat) * (Math.PI / 180);
      // Smooth transition via simple lerp over multiple frames
      autoRotate.current = false;
      const startY = globeRef.current.rotation.y;
      const startX = globeRef.current.rotation.x;
      let frame = 0;
      const totalFrames = 40;
      function flyTo() {
        frame++;
        const t = frame / totalFrames;
        const ease = 1 - Math.pow(1 - t, 3);
        globeRef.current.rotation.y = startY + (targetY - startY) * ease;
        globeRef.current.rotation.x = startX + (targetX - startX) * ease;
        if (frame < totalFrames) requestAnimationFrame(flyTo);
      }
      flyTo();
    }
  }, [selectedEntry]);

  /* ═══ Double-click to re-enable auto rotation ═══ */
  const handleDoubleClick = useCallback(() => {
    autoRotate.current = true;
  }, []);

  const isTr = lang === 'tr';

  return (
    <div className="yaqut-globe-wrapper">
      <div ref={containerRef} className="yaqut-globe-canvas"
        onDoubleClick={handleDoubleClick} />

      {/* Globe stats overlay */}
      <div className="yaqut-globe-stats">
        {data.length.toLocaleString()} {ty.geocoded || 'koordinatlı'}
      </div>

      {/* Globe hint */}
      <div className="yaqut-globe-hint">
        {ty.globeHint || (isTr
          ? '🖱 Sürükle: döndür · Tekerlek: yakınlaştır · Çift tıkla: oto-dönüş'
          : '🖱 Drag: rotate · Wheel: zoom · Dbl-click: auto-rotate')}
      </div>

      {/* Selected info bar */}
      {selectedEntry && (
        <div className="yaqut-globe-selected">
          <span className="yaqut-globe-selected-ar" dir="rtl">{selectedEntry.h}</span>
          <span className="yaqut-globe-selected-name">
            {isTr ? selectedEntry.ht : selectedEntry.he}
          </span>
          <span className="yaqut-globe-selected-type">
            {isTr ? selectedEntry.gtt : selectedEntry.gte}
            {selectedEntry.ct ? ` · ${selectedEntry.ct}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
