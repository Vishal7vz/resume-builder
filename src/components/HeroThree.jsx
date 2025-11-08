import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroThree() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)

    const dir = new THREE.DirectionalLight(0x88ccff, 1.2)
    dir.position.set(5, 5, 5)
    scene.add(dir)

    const geo = new THREE.IcosahedronGeometry(3, 1)
    const mat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.3, metalness: 0.4 })
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo))
    wire.material.depthTest = false
    wire.material.transparent = true
    wire.material.opacity = 0.15
    wire.material.color = new THREE.Color(0x60a5fa)
    scene.add(wire)

    const onResize = () => {
      const { clientWidth, clientHeight } = mount
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
    }

    window.addEventListener('resize', onResize)
    onResize()

    const clock = new THREE.Clock()
    let raf
    const animate = () => {
      const t = clock.getElapsedTime()
      mesh.rotation.x += 0.003
      mesh.rotation.y += 0.004
      wire.rotation.copy(mesh.rotation)
      dir.position.x = Math.sin(t) * 6
      dir.position.y = 4 + Math.cos(t * 0.5) * 1.5
      raf = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      if (renderer.domElement && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
      geo.dispose()
      mat.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900 via-black to-slate-950 shadow-lg shadow-black/30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-24 h-64 w-64 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-28 h-80 w-80 bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl rounded-full" />
      </div>
      <div ref={mountRef} className="w-full h-full" />
    </div>
  )
}
