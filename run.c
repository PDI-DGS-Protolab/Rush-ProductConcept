#include <unistd.h>
#include <sys/types.h>
#include <errno.h>
#include <stdio.h>
#include <sys/wait.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <pthread.h>    /* POSIX Threads */
#include <time.h>
#include <sys/resource.h>
#include <malloc.h>
#include <math.h>

int num_reqs = 5000; /* A global variable*/

void * request_function ();
void sleepMs(int milisec);
int getMemory();
void * getData ( void *ptr );
void * doCall ();
void random_string(char * string, size_t length);

int testing = 1;
int requests = 0;
int responses = 0;

pthread_mutex_t mutexres;


void sleepMs(int milisec){
    struct timespec req = {0};
    req.tv_sec = milisec / 1000;
    req.tv_nsec = (milisec % 1000) * 1000000L;

    nanosleep(&req, (struct timespec *)NULL);
}

int size;

int main(int argc, char *argv[])
{
    printf("Requests: %d. Responses: %d. Used space %d\n", requests, responses, getMemory());
    pthread_t threads [num_reqs];
    pthread_t dataThread;

    pthread_attr_t attr;

    int status;
    int i;

    int sleep = atoi(argv[1]);
    size = atoi(argv[2]);

    pthread_mutex_init(&mutexres, NULL);
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

    pthread_create (&dataThread, NULL, (void *) getData, NULL);

    for(i = 0; i<num_reqs;i++){
        sleepMs(sleep);
        requests++;
        pthread_create (&threads[i], &attr, (void *) request_function, NULL);
    }

    testing = 0;

    pthread_attr_destroy(&attr);

    pthread_mutex_destroy(&mutexres);

    pthread_join(dataThread, NULL);
}


void * request_function (void * ptr){

      CURL *curl;
      CURLcode res;
      struct stat file_info;
      double speed_upload, total_time;

      char name [30];
      FILE * file;

      time_t result = time(NULL);
      sprintf(name, "%d.test", (int) result);
      file = fopen(name, "w");
      ftruncate(fileno(file), size *  1024);
      fclose(file);

      file = fopen(name, "r"); /* open file to upload */
      if(!file) {
        printf("FILE ES NULL\n");
        return;
      }

      /* to get the file size */
      if(fstat(fileno(file), &file_info) != 0) {
        return;
      }

      printf("Se hace peticion\n");

      curl = curl_easy_init();
      if(curl) {
        /* upload to this place */
        curl_easy_setopt(curl, CURLOPT_URL, "http://ec2-54-199-108-216.ap-northeast-1.compute.amazonaws.com:80/");
        //curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:8000/");

        curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1);

        /* tell it to "upload" to the URL */
        curl_easy_setopt(curl, CURLOPT_UPLOAD, 1L);

        /* pointer to pass to our read function */
        curl_easy_setopt(curl, CURLOPT_READDATA, file);

        curl_easy_setopt(curl, CURLOPT_INFILESIZE_LARGE,
                     (curl_off_t)file_info.st_size);


        /* enable verbose for easier tracing */
        //curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);

        res = curl_easy_perform(curl);
        /* Check for errors */
        if(res != CURLE_OK) {
          fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));

        }
        else {
          /* now extract transfer info */
          curl_easy_getinfo(curl, CURLINFO_SPEED_UPLOAD, &speed_upload);
          curl_easy_getinfo(curl, CURLINFO_TOTAL_TIME, &total_time);

          //fprintf(stderr, "Speed: %.3f bytes/sec during %.3f seconds\n",speed_upload, total_time);
        }
        /* always cleanup */
        curl_easy_cleanup(curl);

        fclose(file);
        unlink(name);

        pthread_mutex_lock (&mutexres);
        responses++;
        pthread_mutex_unlock (&mutexres);

      }
}

int getMemory () {
  int pid = getpid();
  char path[128] = "/proc/";
  sprintf(path + strlen(path), "%d", pid);
  sprintf(path + strlen(path), "/status");

  FILE *fp;
  fp = fopen(path,"r");
  char buf[256];
  int cont = 0;
  while (fgets (buf, sizeof(buf), fp)) {
    cont ++;
    if (cont == 16 ) {
      break;
    }
  }

  char* token;
  char* string;
  string = strdup(buf);
  token = strsep(&string, "\t");
  int res = (int) strtol(string, (char **)NULL, 10);
  return res;
}

void * getData (void * ptr){

    FILE * pFile = fopen("runData.csv", "a");
    int data [5000];
    int samples = 0;
    int max = 0;

    while(testing || responses != requests)
    {
        sleep(2);
        int memory = getMemory();
        printf("Requests: %d. Responses: %d. Used space %d\n", requests, responses, memory);
        fprintf(pFile, "%d, %d, %d\n", requests, responses, memory);
        data[samples] = memory;
        max = (memory > max) ? memory : max;
        samples++;
    }

    double media, varianza, desviacion;
    int i;

    for (i = 0; i < samples; i++)
    {
      media += ((double)data[i])/samples;
    }

    for (i = 0; i < samples; i++)
    {
      varianza += pow(((double)data[i] - media), 2)/samples;
    }

    desviacion = sqrt(varianza);

    printf("Media: %.2f\n", media);
    printf("Desviacion estándar: %.2f\n", desviacion);
    printf("Máximo: %d\n", max);

    fclose(pFile);
    pthread_exit(0); /* exit */
}
