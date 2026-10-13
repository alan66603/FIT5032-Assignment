<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-brand pt-5 pb-4 mt-5">
    <div class="container">
      <div class="row g-4">
        <div class="col-md-5">
          <h2 class="h5 fw-bold">🌿 GREENROOTS</h2>
          <p class="small footer-muted">
            Community-led greening projects across Melbourne's inner north and west.
          </p>
        </div>

        <div class="col-6 col-md-3">
          <h3 class="h6 fw-bold">Explore</h3>
          <ul class="list-unstyled small">
            <li><router-link to="/" class="footer-link">Home</router-link></li>
            <li><router-link to="/grants" class="footer-link">Grants</router-link></li>
            <li><router-link to="/map" class="footer-link">Map</router-link></li>
            <li><router-link to="/events" class="footer-link">Planting days</router-link></li>
            <li><router-link to="/about" class="footer-link">About</router-link></li>
          </ul>
        </div>

        <div class="col-6 col-md-4">
          <h3 class="h6 fw-bold">Contact</h3>
          <ul class="list-unstyled small footer-muted">
            <li>hello@greenroots.org.au</li>
            <li>(03) 9000 1234</li>
            <li>Fitzroy, VIC 3065</li>
          </ul>
        </div>
      </div>

      <hr class="border-light opacity-25" />
      <p class="small footer-muted mb-0">© {{ year }} GreenRoots Melbourne. Demo project for FIT5032.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer-muted {
  color: rgba(255, 255, 255, 0.7);
}
.footer-link {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
}
.footer-link:hover {
  color: #fff;
  text-decoration: underline;
}
</style>
